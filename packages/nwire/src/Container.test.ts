import { describe, expect, it, test } from "vitest"
import { Container } from "./Container"

class RandomizerDependency {
  constructor() {
    this._id = Math.floor(Math.random() * 1000)
  }

  private _id: number
  get id() {
    return this._id
  }
}

type TestContext = {
  wheels: Wheels
  dependencies: {
    machines: {
      car: Car
    }
  }
  tire: Transmission
}

class Wheels {
  constructor(_context: TestContext, private n: number) {}

  test() {
    return this.n
  }
}

class Car {
  constructor(private context: TestContext, private _name: string) {}

  name() {
    return this._name
  }

  test() {
    return this.context.wheels.test()
  }
}

class Transmission {
  constructor(private context: TestContext) {}

  belongsTo() {
    return this.context.dependencies.machines.car.name()
  }
}

describe("nwire", () => {
  it("creates a container", () => {
    const container = Container.build<TestContext>()
    expect(container).toBeTruthy()
  })

  it("registers a dependency", () => {
    const dependency = { test: () => console.info("testing!") }
    Container.register("dependency", () => dependency)
  })

  it("unregisters a dependency", () => {
    const dependency = { test: () => console.info("testing!") }

    const container = Container.build()
      .register("dependency", () => dependency)
      .unregister("dependency")

    const resolved = container.resolve("dependency" as never)
    expect(resolved).toBeUndefined()
  })

  describe("scenario", () => {
    it("resolves registered dependency", () => {
      const dependency = { test: () => console.info("testing!") }
      const container = Container.register("dependency", () => dependency)

      const resolved = container.resolve("dependency")
      expect(resolved).toBe(dependency)
    })

    it("resolves classes", () => {
      const container = Container.register("wheels", () => Wheels)

      const resolved = container.resolve<Wheels>("wheels")
      expect(resolved).toEqual(Wheels)
    })

    it("creates a context", () => {
      const context = Container.build<TestContext>()
        .register("wheels", () => Wheels)
        .context()

      const Klass = context.wheels
      const wheels = new Klass(context, 4)

      expect(context).toBeTruthy()
      expect(Klass).toBeTruthy()
      expect(wheels.test).toBeTruthy()
    })

    it("understands singletons", () => {
      const context = Container.instance("wheels", Wheels).context()
      expect(context.wheels.test).toBeTruthy()
    })

    it("creates singletons lazily", () => {
      const context = Container.instance("dependent", Car)
        .instance("wheels", Wheels, 1)
        .context()

      expect(context.dependent.test()).toEqual(1)
    })

    it("allows groupings of containers", () => {
      const context = Container.group("dependencies", (container) =>
        container.instance("wheels", Wheels)
      ).context()

      expect(context.dependencies.wheels.test).toBeTruthy()
    })

    it("groupings have access to lazy dependencies in parent", () => {
      const context = Container.instance("wheels", Wheels, 1)
        .group("dependencies", (container) => container.instance("car", Car))
        .context()

      expect(context.dependencies.car.test()).toEqual(1)
    })

    it("groupings have access to lazy dependencies in parent by registration", () => {
      const context = Container.build<TestContext>()
        .instance("wheels", Wheels, 4)
        .group("dependencies", (container) =>
          container.register(
            "car",
            (container) => new Car(container, "Test Car")
          )
        )
        .context()

      expect(context.dependencies.car.test()).toEqual(4)
    })

    it("dependencies of groupings of groupings resolve correctly", () => {
      const context = Container.build<TestContext>()
        .instance("wheels", Wheels, 4)
        .instance("transmission", Transmission)
        .group("dependencies", (dependencies) =>
          dependencies.group("machines", (machines) =>
            machines.register("car", (context) => new Car(context, "Test Car"))
          )
        )
        .context()

      expect(context.transmission.belongsTo()).toEqual("Test Car")
    })

    it("can pass in additional parameters to the constructor of a singleton", () => {
      const context = Container.instance("wheels", Wheels, 3)
        .group("dependencies", (container) => container.instance("car", Car))
        .context()

      expect(context.dependencies.car.test()).toEqual(3)
    })

    it("returns a singleton", () => {
      const context = Container.instance(
        "randomizer",
        RandomizerDependency
      ).context()

      expect(context.randomizer.id).toEqual(context.randomizer.id)
    })

    it("does not return a singleton when transient", () => {
      const context = Container.register(
        "randomizer",
        () => new RandomizerDependency(),
        { transient: true }
      ).context()

      expect(context.randomizer.id).not.toEqual(context.randomizer.id)
    })
  })
})
