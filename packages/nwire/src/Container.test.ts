import { describe, expect, it, test } from "vitest"
import { Container } from "./Container"
import { Singleton, Service } from "./Singleton"

describe("nwire", () => {
  it("creates a container", () => {
    const container = Container.new<TestContext>()
    expect(container).toBeTruthy()
  })

  it("registers a dependency", () => {
    const dependency = { test: () => console.info("testing!") }
    Container.new().register("dependency", () => dependency)
  })

  it("unregisters a dependency", () => {
    const dependency = { test: () => console.info("testing!") }

    const container = Container.new()
      .register("dependency", () => dependency)
      .unregister("dependency")

    expect(() => container.resolve("dependency" as never)).toThrow()
  })

  it("returns undefined when dependency is not found", () => {
    const container = Container.new()

    expect(() =>
      container
        .register("hello", () => {})
        .resolve("nonexistentDependency" as never)
    ).toThrow()
  })

  it("registers middleware", () => {
    const container = Container.new().middleware((container) => {
      return container.group("hello", (container) => {
        return container.register("world", () => "world")
      })
    })

    const context = container.context()

    expect(context.hello.world).toEqual("world")
  })

  describe("resolution", () => {
    it("allows overriding of a registered dependency", () => {
      const firstDependency = { test: () => "first" }
      const secondDependency = { test: () => "second" }

      const container = Container.new().register(
        "dependency",
        () => firstDependency
      )
      container.register("dependency", () => secondDependency)

      const resolved = container.resolve<{ test: () => {} }>("dependency")
      expect(resolved.test()).toBe("second")
    })

    it("resolves deeply nested dependencies", () => {
      const container = Container.new()
        .singleton("wheels", Wheels, 4)
        .group("dependencies", (dependencies) =>
          dependencies.group("machines", (machines) =>
            machines.group("deep", (deep) =>
              deep.register(
                "car",
                () => new Car(machines.root.context(), "Test Car")
              )
            )
          )
        )
        .context()

      expect(container.dependencies.machines.deep.car.test()).toEqual(4)
    })

    it("resolves dependencies in the correct order", () => {
      let order = ""
      const firstDependency = { test: () => (order += "first") }
      const secondDependency = { test: () => (order += "second") }

      const container = Container.new()
        .register("first", () => firstDependency)
        .register("second", (context) => {
          context.first.test()
          return secondDependency
        })

      container.resolve<typeof secondDependency>("second").test()

      expect(order).toBe("firstsecond")
    })

    it("allows registrations to use future dependencies (fully resolved context)", () => {
      const context = Container.new<{ producer: { message: string } }>()
        .register("consumer", (context) => context.producer.message)
        .register("producer", () => ({
          message: "test",
        }))
        .context()

      expect(context.consumer).toBe("test")
    })

    it("ensures the correct baseContext is accessed when creating multiple contexts with a single container", () => {
      const identifierA = "valueFromContextA"
      const identifierB = "valueFromContextB"

      const container = Container.new()
        .base({ contextIdentifier: identifierA })
        .base({ contextIdentifier: identifierB })
        .register("contextKey", (context) => context["contextIdentifier"])

      const contextA = container.context()
      const contextB = container.context()

      // The last registered base context should be the one that is used
      expect(contextA.contextKey).toBe(identifierB)
      expect(contextB.contextKey).toBe(identifierB)
    })

    it("resolves registered dependency", () => {
      const dependency = { test: () => console.info("testing!") }
      const container = Container.new().register("dependency", () => dependency)

      const resolved = container.resolve("dependency")
      expect(resolved).toBe(dependency)
    })

    it("resolves classes", () => {
      const container = Container.new().register("wheels", () => Wheels)

      const resolved = container.resolve<Wheels>("wheels")
      expect(resolved).toEqual(Wheels)
    })

    it("creates a context", () => {
      const context = Container.new<TestContext>()
        .register("wheels", () => Wheels)
        .context()

      const Klass = context.wheels
      const wheels = new Klass(context, 4)

      expect(context).toBeTruthy()
      expect(Klass).toBeTruthy()
      expect(wheels.test).toBeTruthy()
    })

    it("understands singletons", () => {
      const context = Container.new().singleton("wheels", Wheels).context()
      expect(context.wheels.test).toBeTruthy()
    })

    it("creates singletons lazily", () => {
      const context = Container.new()
        .singleton("dependent", Car)
        .singleton("wheels", Wheels, 1)
        .context()

      expect(context.dependent.test()).toEqual(1)
    })

    it("allows groupings of containers", () => {
      const context = Container.new()
        .group("dependencies", (container) => {
          return container.singleton("wheels", Wheels)
        })
        .context()

      expect(context.dependencies.wheels.test).toBeTruthy()
    })

    it("groupings have access to lazy dependencies in parent", () => {
      const context = Container.new()
        .singleton("wheels", Wheels, 1)
        .group("dependencies", (container) => container.singleton("car", Car))
        .context()

      expect(context.dependencies.car.test()).toEqual(1)
    })

    it("groupings have access to lazy dependencies in parent by registration", () => {
      const context = Container.new<TestContext>()
        .singleton("wheels", Wheels, 4)
        .group("dependencies", (dependencies) =>
          dependencies.register(
            "car",
            () => new Car(dependencies.root.context(), "Test Car")
          )
        )
        .context()

      expect(context.dependencies.car.test()).toEqual(4)
    })

    it("dependencies of groupings of groupings resolve correctly", () => {
      const context = Container.new<TestContext>()
        .singleton("wheels", Wheels, 4)
        .singleton("transmission", Transmission)
        .group("dependencies", (dependencies) =>
          dependencies.group("machines", (machines) =>
            machines.register(
              "car",
              () => new Car(machines.root.context(), "Test Car")
            )
          )
        )
        .context()

      expect(context.transmission.belongsTo()).toEqual("Test Car")
      expect(context.dependencies.machines.car.test()).toEqual(4)
    })

    it("can pass in additional parameters to the constructor of a singleton", () => {
      const context = Container.new()
        .singleton("wheels", Wheels, 3)
        .group("dependencies", (container) => container.singleton("car", Car))
        .context()

      expect(context.dependencies.car.test()).toEqual(3)
    })

    it("returns a singleton", () => {
      const context = Container.new()
        .singleton("randomizer", RandomizerDependency)
        .context()

      expect(context.randomizer.id).toEqual(context.randomizer.id)
    })

    it("does not return a singleton when transient", () => {
      const context = Container.new()
        .register("randomizer", () => new RandomizerDependency(), {
          transient: true,
        })
        .context()

      expect(context.randomizer.id).not.toEqual(context.randomizer.id)
    })

    it("root context takes precedence", () => {
      const context = Container.new()
        .register("hello", () => "hello")
        .context({ world: "world" })

      expect(context.world).toEqual("world")
    })
  })

  describe("singletons", () => {
    class A extends Service<TestContext>() {
      test() {
        return this.services.b.something()
      }

      something() {
        return "1"
      }
    }
    class B extends Service<TestContext>() {
      test() {
        return this.services.a.something()
      }

      something() {
        return "2"
      }
    }

    class C extends Service<TestContext>() {
      test() {
        return this.services.a.something()
      }

      something() {
        return "7"
      }
    }

    class D extends Service<TestContext>() {
      test() {
        return this.services.a.something()
      }

      something() {
        return "7"
      }
    }

    class E extends Service<TestContext>() {
      test() {
        return this.services.a.something()
      }
    }

    type Services = {
      a: A
      b: B
      c: C
      d: D
    }

    type TestContext = {
      a: A
      services: Services
    }

    it("can resolve references that are not yet registered", () => {
      const context = Container.new()
        .group("events", (events) => events.singleton("e", E))
        .group("services", (services) => services.singleton("a", A))
        .context()

      expect(context.events.e.test()).toEqual("1")
    })

    it("can resolve references that are not yet registered by middleware", () => {
      const context = Container.new()
        .middleware((container) =>
          container.group("events", (events) => events.singleton("e", E))
        )
        .middleware((container) =>
          container.group("services", (services) => services.singleton("a", A))
        )
        .context()

      expect(context.events.e.test()).toEqual("1")
    })

    it("can resolve circular references", () => {
      const context = Container.new()
        .group("services", (container) =>
          container
            .singleton("a", A)
            .singleton("b", B)
            .singleton("c", C)
            .singleton("d", D)
            .singleton("e", D)
            .singleton("f", A)
        )
        .context()

      expect(context.services).not.toBeUndefined()
      expect(context.services.b.test()).toEqual("1")
      expect(context.services.a.test()).toEqual("2")

      expect(() => {
        expect(context.services.a.services).toEqual(undefined)
      }).toThrowError()
    })

    it("can handle instances at the root", () => {
      const context = Container.new()
        .singleton("a", A)
        .group("services", (services) => services.singleton("b", B))
        .context()

      expect(context.a.test()).toEqual("2")
    })
  })
})

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
