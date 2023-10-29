# nwire

![Tests](https://github.com/divmgl/nwire/actions/workflows/tests.yml/badge.svg)

`nwire` is a package that provides simplified dependency injection in Node.js.

```tsx
import { Container, Injected } from "nwire"

type MyTypedContext = {
  banner: string
  my: MyService
}

export class MyService extends WithContextProperties(Singleton) {
  helloWorld() {
    return this.banner
  }
}

const context = Container.new()
  .register("banner", () => "Hello world!")
  .instance("my", MyService)
  .context()

console.log(context.my.helloWorld()) // => console output: "Hello world!"
```

## API

`nwire` has two high-level concepts: the `Container` and the `Context`. The `Container` allows you to compose a strongly-typed `Context`, and the `Context` is the proxy that resolves dependencies for you lazily. The `Context` lives within the `Container` (as a closure) and interacts with the registration of your dependencies behind the scenes.

When using the library you likely won't have to think about these semantics, but we figured it's important to understand how it works under the hood.

### `Container`

The `Container` class is the main entrypoint for `nwire`. It provides a fluent API for registering
dependencies and creating `Context`s from them.

#### Creating a `Container`

You can use `new Container()` to create a container:

```tsx
const container = new Container()

container.register("prisma", new PrismaClient())
container.register("redis", new Redis())

const context = container.context()
```

In a majority of cases you'll be creating a single container, registering a bunch of dependencies, and then grabbing the generated `Context`. For this reason we've included static methods that return a new container and are chainable, so you can write your code like this instead:

```tsx
const context = Container.new()
  .register("prisma", () => new PrismaClient())
  .register("redis", () => new Redis())
  .context()
```

The choice is yours: you can keep the `Container` around in case you want to register more dependencies later, or you can simply grab the `Context`.

#### `Container.register`

Registers a dependency with the container.

```tsx
Container.register("prisma", () => new PrismaClient()) // => Container
```

The second argument is a function that returns the dependency.

You also have access to the fully resolved `Context` at resolution time, in case you wish to do something with it:

```tsx
Container.register("users", (context) => new UsersService(context)) // => Container
```

> ⚠️ The `Context` that's sent to the dependency will be fully setup, but this may not match what the compiler sees as TypeScript is only able to gather what's been currently registered. For instance, the following results in a compiler error:

```tsx
const context = Container.new()
  .register("tasksCreator", (context) => new TasksCreator(context))
  // Argument of type '{}' is not assignable to parameter of type 'AppContext'.
  // Type '{}' is missing the following properties from type 'AppContext': tasks, tasksCreator
  .register("tasks", (context) => new SQLiteTaskStore(context))
```
> This is because `TasksCreator` is asking for a fully typed context but the context up until this registration is completely empty. You can overcome this by adding a type to the `Container.prototype.context` call. You can read more about it in the [Context](#Container.context) section.


However, a method is included to avoid this boilerplate altogether:

#### `Container.singleton`

Your goal will often be to simply pass in the fully resolved `Context` to classes. For this reason, `nwire` provides a function that will create a new instance of your class with a fully resolved `Context` whenever the dependency is resolved:

```tsx
Container.instance("users", UsersService) // => Container
```

When the `users` dependency is used, `nwire` will create a new `UsersService` class with the resolved `Context` as the first parameter:

```tsx
const user = await context.users.findOne("123")

// Equivalent without nwire, sans singleton setup:
const users = new UsersService(container.context())
const user = await users.findOne("123")
```

You can also pass in additional arguments to the constructor:

```tsx
Container.instance("users", UsersService, { cookieSecret: process.env.COOKIE_SECRET })
```

#### `Container.group`

Sometimes you'll want to group things together within the `Container`. You could technically do this:

```tsx
const context = Container.new()
  .register("services", (context) => ({
    users: new UsersService(context),
    tasks: new TasksService(context),
  }))
  .context()
```

And now all services will be nested under `services`:

```tsx
context.services.users.findOne("123")
```

However, this has a big issue: once you access `service` for the first time you make an instance of every single class all at once.

`nwire` provides a solution for this: `Container.group`. `Container.group` creates a nested `Container` that will only resolve when you access properties within it. The nested container will be passed as the first argument to the function you pass in:

```tsx
const context = Container.new()
  .group("services", (services: Container) =>
    services
      .singleton("users", UsersService)
      .singleton("tasks", TasksService)
  )
  .context()

type AppContext = typeof context
```

```tsx
type AppContext = {
  services: {
    users: UsersService
    tasks: TasksService
  }
}
```

```tsx
// Two contexts are used for resolution here: `context` and `services`
context.services.users.findOne("123")
```

#### `Container.instance`

An alias for `Container.singleton`.

### `Context`

The `Context` class is the dependency proxy that the `Container` produces. This class allows you to access your dependencies using the names you registered them with:

```tsx
const context = Container.new()
  .register("users" /** Registry name */, () => new UsersService())
  .context() // Proxy created at this point

const user = await context.users.findOne("123")
```

You want to pass your `Context` around to all of your dependencies to enable the lazy resolution of dependencies. You can do this manually like so:

```ts
export class MyService {
  constructor(private context: MyTypedContext) {}
}
```

But this is a bit hard to remember. For this reason `nwire` provides a base class named `Injected` which takes care of this for you (and allows you to omit the constructor altogether):

```tsx
import { Injected } from "nwire"

export class MyService extends Injected<MyTypedContext> {
  helloWorld() {
    return this.context.banner;
  }
}
```

This class will fit into the `Container.prototype.instance` API:

```tsx
const context = Container.new()
  .register("banner", () => "Hello world!")
  .instance("my", MyService) // No type errors
  .context()

context.my.helloWorld() // => console output: "Hello world!"
```

#### `Container.context`

Creates a new `Context` class. This is the class you're meant to pass around to all of your dependencies. It's responsible for resolving dependencies:

```tsx
const context = Container.new()
  // ... lots of registrations here
  .register("users", () => new UsersService())
  .context()

const user = await context.users.findOne("123")
// `users` is resolved lazily.
```

`nwire` will only resolve dependencies when they're needed. This is an intentional design decision to avoid having to instantiate the entire `Container`, which is especially useful for tests. However, the type that `.context()` outputs will always be the _fully_ typed `Context`.

#### `Container.context<T>`: ⚠️ Needed for TypeScript

It's recommended you pass an explicit type to the `context` function.

```tsx
export type AppContext = {
  users: UsersService
  tasks: TasksService
  tasksCreator: TasksCreator
}

const context = Container.new()
  .register("tasksCreator", (context) => new TasksCreator(context))
  .register("tasks", (context) => new SQLiteTaskStore(context))
  .context<AppContext>()
```

Doing so helps you avoid several issues:

**Circular Dependencies**

Because a fully typed `Context` is sent as an argument in a dependency's constructor, you'll run into issues if you attempt to do something like this:

```tsx
export type AppContext = Awaited<ReturnType<typeof context>>
```

This will cause the compiler to completely brick in any service that uses the `AppContext` type. This is because a circular reference is created when a class is registered on the same context that it reads from.

**Incomplete `Context` types**

You'll also run into issues if you attempt to pass a partial context during registration to constructor:

```tsx
export const context = Container.new()
  .register("users", (contextUpToThisPoint) => new UsersService(contextUpToThisPoint))
  // Argument of type '{}' is not assignable to parameter of type 'AppContext'.
  // Type '{}' is missing the following properties from type 'AppContext': users
  .context()
  
```

This is because the compiler doesn't know what the `contextUpToThisPoint` type is until it's been decorated using `register` and `instance`.

### Lifetime of a dependency

`nwire` will resolve dependencies for you lazily and keep an instance of the dependency as a singleton by default.

```tsx
container.register("randomizer", () => new RandomizerClass())
container.resolve<RandomizerClass>("randomizer").id // => 353
container.resolve<RandomizerClass>("randomizer").id // => 353
```

Unless unregistered, the dependency will be kept in memory for the lifetime of the `Container`.

However, you can create transient dependencies by specifying the `{ transient: true }` option:

```tsx
container.register("randomizer", () => new RandomizerClass(), {
  transient: true,
})
container.resolve<RandomizerClass>("randomizer").id // => 964
container.resolve<RandomizerClass>("randomizer").id // => 248
```

`nwire` will invoke this function when the `randomizer` dependency is either resolved through the `Container` using `Container.resolve` or through the `Context` using `context.randomizer`.

There is currently no API for transient `instance` registrations, so if you do want to create a unique instance on every call you'll need to provide an initial context:

```tsx
const context = Container.new<AppContext>()
  .register("users", (context) => new UsersService(context), { transient: true }))
  .context()
```

## What is dependency injection?

Dependency injection is the process of keeping your components loosely coupled. This pattern makes
it easy to swap out the underlying implementations of dependencies as long as the contracts stay
the same.

### An example

Consider a `UsersService`:

```tsx
class UsersService {
  constructor(private psql: Postgres) {}

  async find(id: string) {
    return await this.psql.query("SELECT * FROM id WHERE id = ?", [id])
  }

  // ... other functions that use this.psql //
}
```

In this contrived example, the users service is tightly coupled to the Postgres client library. This
means that if in the future you wanted to change the underlying access implementation, you'd have to
introduce another dependency in the constructor, thus now coupling both libraries tightly to the
service:

```tsx
class UsersService {
  constructor(private psql: Postgres, private prisma: Prisma) {}

  async find(id: string) {
    return await this.prisma.users({ where: { id } })
  }
}
```

You can overcome this by using a repository:

```tsx
class UsersService {
  constructor(private users: UserRepository /* Interface or type */) {}

  async find(id: string) {
    return await this.users.findOne(id)
  }
}
```

By passing in a repository to the constructor that encapsulates the data access concerns we can
change the underlying implementation without affecting dependent services.

However, we still have an issue: we have to manually pass in `UserRepository` every single time:

```tsx
const userRepository = new UserRepository()
const usersService = new UsersService(userRepository)
```

Additionally, if you pass in a variety of different dependencies often to services, you'll end up
with a god object of all of your dependencies:

```tsx
const dependencies = {
  usersService: new UsersService(userRepository),
  ticketingService: new TicketingService(),
}

const server = new Server(dependencies) // Massive object that's already been resolved
```

This is where **dependency injection** comes in. Dependency injection is the process of resolving a
necessary dependency when needed. It works by registering all of your dependencies within a container
and when a dependency is needed the framework will resolve it for you.

### With `nwire`

Consider the previous example in `nwire`:

```tsx
const context = Container.new()
  .singleton("users", UsersService)
  .register("prisma", new PrismaClient())
  .register("psql", new Postgres())

const user = await context.users.find("123")
```

`nwire` keeps a list of your registrations and makes them available to your services as needed. When
the `UsersService` calls `users.findOne`, `nwire` will **lazily** return an instance of
`UserRepository`.

> ⚠️ `nwire` contexts are not normal objects. `nwire` uses a proxy under the hood to evaluate your dependencies as needed. This is an intentional design decision to avoid having to instantiate the entire `Container` for tests.

## License

MIT
