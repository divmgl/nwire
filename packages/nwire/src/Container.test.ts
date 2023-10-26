import { describe, expect, it, test } from "vitest"
import { Container } from "./Container"

type TestContext = {
  container: Container
}

class TestDependency {
  test() {
    console.log("testing!")
    return 1
  }
}

class DependentDependency {
  constructor(private context: { dependency: TestDependency }, private n: 3) {}

  test() {
    console.log(this.context)
    return this.n ?? this.context.dependency.test()
  }
}

describe("nwire", () => {
  it("creates a container", () => {
    const container = Container.build()
    expect(container).toBeTruthy()
  })

  it("registers a dependency", () => {
    const dependency = { test: () => console.log("testing!") }
    Container.register("dependency", dependency)
  })

  it("unregisters a dependency", () => {
    const dependency = { test: () => console.log("testing!") }

    const container = Container.build()
      .register("dependency", dependency)
      .unregister("dependency")

    const resolved = container.resolve("dependency" as never)
    expect(resolved).toBeUndefined()
  })

  it("resolves registered dependency", () => {
    const dependency = { test: () => console.log("testing!") }
    const container = Container.register("dependency", dependency)

    const resolved = container.resolve("dependency")
    expect(resolved).toBe(dependency)
  })

  it("resolves classes", () => {
    const container = Container.register("dependency", TestDependency)

    const resolved = container.resolve<TestDependency>("dependency")
    expect(resolved).toEqual(TestDependency)
  })

  it("creates a context", () => {
    const context = Container.register("dependency", TestDependency).context()

    const DependencyClass = context.dependency
    const dependency = new DependencyClass()

    expect(context).toBeTruthy()
    expect(DependencyClass).toBeTruthy()
    expect(dependency.test).toBeTruthy()
  })

  it("understands singletons", () => {
    const context = Container.singleton("dependency", TestDependency).context()

    expect(context.dependency.test).toBeTruthy()
  })

  it("creates singletons lazily", () => {
    const context = Container.singleton("dependent", DependentDependency)
      .singleton("dependency", TestDependency)
      .context()

    expect(context.dependent.test()).toEqual(1)
  })

  it("allows groupings of containers", () => {
    const context = Container.group("dependencies", (container) =>
      container.singleton("dependency", TestDependency)
    ).context()

    expect(context.dependencies.dependency.test).toBeTruthy()
  })

  it("groupings have access to lazy dependencies in parent", () => {
    const context = Container.singleton("dependency", TestDependency)
      .group("dependencies", (container) =>
        container.singleton("dependent", DependentDependency)
      )
      .context()

    expect(context.dependencies.dependent.test()).toEqual(1)
  })

  it("can pass in additional parameters to the constructor of a singleton", () => {
    const context = Container.singleton("dependency", TestDependency)
      .group("dependencies", (container) =>
        container.singleton("dependent", DependentDependency, 3)
      )
      .context()

    expect(context.dependencies.dependent.test()).toEqual(3)
  })
})
