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
class TestDependency {
  test() {
    return 1
  }
}

class DependentDependency {
  constructor(private context: { dependency: TestDependency }, private n: 3) {}

  test() {
    return this.n ?? this.context.dependency.test()
  }
}

describe("nwire", () => {
  it("creates a container", () => {
    const container = Container.build()
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

  it("resolves registered dependency", () => {
    const dependency = { test: () => console.info("testing!") }
    const container = Container.register("dependency", () => dependency)

    const resolved = container.resolve("dependency")
    expect(resolved).toBe(dependency)
  })

  it("resolves classes", () => {
    const container = Container.register("dependency", () => TestDependency)

    const resolved = container.resolve<TestDependency>("dependency")
    expect(resolved).toEqual(TestDependency)
  })

  it("creates a context", () => {
    const context = Container.register(
      "dependency",
      () => TestDependency
    ).context()

    const DependencyClass = context.dependency
    const dependency = new DependencyClass()

    expect(context).toBeTruthy()
    expect(DependencyClass).toBeTruthy()
    expect(dependency.test).toBeTruthy()
  })

  it("understands singletons", () => {
    const context = Container.instance("dependency", TestDependency).context()

    expect(context.dependency.test).toBeTruthy()
  })

  it("creates singletons lazily", () => {
    const context = Container.instance("dependent", DependentDependency)
      .instance("dependency", TestDependency)
      .context()

    expect(context.dependent.test()).toEqual(1)
  })

  it("allows groupings of containers", () => {
    const context = Container.group("dependencies", (container) =>
      container.instance("dependency", TestDependency)
    ).context()

    expect(context.dependencies.dependency.test).toBeTruthy()
  })

  it("groupings have access to lazy dependencies in parent", () => {
    const context = Container.instance("dependency", TestDependency)
      .group("dependencies", (container) =>
        container.instance("dependent", DependentDependency)
      )
      .context()

    expect(context.dependencies.dependent.test()).toEqual(1)
  })

  it("can pass in additional parameters to the constructor of a singleton", () => {
    const context = Container.instance("dependency", TestDependency)
      .group("dependencies", (container) =>
        container.instance("dependent", DependentDependency, 3)
      )
      .context()

    expect(context.dependencies.dependent.test()).toEqual(3)
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
