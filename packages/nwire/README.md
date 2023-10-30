# nwire

![Tests](https://github.com/divmgl/nwire/actions/workflows/tests.yml/badge.svg)

`nwire` is a dependency injection container with a strongly-typed fluent API that makes it easier to write large type-safe applications.

```tsx
import { Container, Service } from "nwire"

type MyTypedContext = {
  banner: string
  my: MyService
}

export class MyService extends Service<MyTypedContext>() {
  helloWorld() {
    return this.banner
  }
}

const context = Container.new()
  .register("banner", () => "Hello world!")
  .singleton("my", MyService)
  .context()

console.log(context.my.helloWorld()) // => console output: "Hello world!"
```
## Installation

```shell
npm i nwire
yarn add nwire
pnpm add nwire
```

## Getting Started

#### 1. Create a type for your `Context`:

```tsx
import Mailgun from "mailgun.js"

type AppContext = {
  mailgun: Mailgun
  users: UsersService
  email: EmailService
  registration: RegistrationService
}
```

> 💡 `nwire` can infer the context type for you, but this is a simplified example.

#### 2. Create services. 

A service is a class that has a dependency on your `AppContext`. `nwire` provides a `Service` class factory for you to use right away:

```tsx
import { Service } from "nwire"

export class UsersService extends Service<AppContext>() {
  // Dependencies in your container are now available as getters on this.
  async findOne(id: string) {
    return await this.db.users.findOne({ where: { id } })
  }
}

export class EmailService extends Service<AppContext>() {
  async send(to: string, subject: string, body: string) {
    return this.mailgun.createMessage({ to, subject, body })
  }
}

// ...
```

#### 3. Create a `Container`, register your dependencies and generate a `Context`:

```tsx
// createAppContext.ts
import Mailgun from require("mailgun.js")
import formData from "form-data"

function createAppContext() {
  return Container.new<AppContext>()
    .register("mailgun", () => new Mailgun(formData))
    .singleton("users", UsersService)
    .singleton("email", EmailService)
    .singleton("registration", RegistrationService)
    .context()
}

export { createAppContext }

// Note: you can also try to omit the type and let TypeScript infer it for you. Using this approach will avoid having to modify multiple places to introduce/remove dependencies.

function createAppContext() {
  return Container.new()
    .register("mailgun", () => new Mailgun(formData))
    .singleton("users", UsersService)
    .singleton("email", EmailService)
    .singleton("registration", RegistrationService)
    .context()
}

type AppContext = typeof ReturnType<createAppContext>

export { createAppContext, AppContext }

// ⚠️ Use this approach with caution as it can lead to circular references.
```

#### 4. Pass it everywhere:

Use this `Context` in your entire app. It's meant to be passed around to all of your entrypoints and classes that need dependencies:

```tsx
// server.ts
import { createAppContext } from "./createAppContext"
// ...

const context = createAppContext()

const server = new AwesomeHttpFrameworkServer()

server.use((req, res, next) => {
  // You decide when the context is added to the request to be used downstream
  req.context = context
  next()
})

server.get("/users/:id", async (req, res) => {
  const user = await req.context.users.findOne(req.params.id)
  res.send(user)
})
```
```tsx
// EmailWorker.ts
import { AppContext } from "./AppContext"
import { Service } from "nwire"
// ...

export class EmailWorker extends Service<AppContext>() // Note the parens
  worker: Worker

  constructor(context: AppContext) {
    super(context)
    
    this.worker = new Worker({ 
      connection: redis, 
      handler: async (payload) => {
        await this.email.send(payload.to, payload.subject, payload.body)
      }
    })
  }
```
```tsx
// Pass the container to literally anything
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

container.register("prisma", () => new PrismaClient())
container.register("redis", () => new Redis())

const context = container.context()
```

In a majority of cases you'll be creating a single container, registering a bunch of dependencies, and then grabbing the generated `Context`. For this reason we've included static methods that return a new container and are chainable, so you can write your code like this instead:

```tsx
const context = Container.new()
  .register("prisma", () => new PrismaClient())
  .register("redis", () => new Redis())
  .context()
```

The choice is yours: you can keep the `Container` around in case you want to register more dependencies later, or you can create the `Context` immediately and use that everywhere.

#### `Container.register`

Registers a dependency with the container. The first argument is an accessor key that you'll use to access the dependency later, and the second argument is a factory function that returns the dependency:

```tsx
Container.register("prisma", () => new PrismaClient()) // => Container
```

The factory function is called with the fully resolved `Context` as the first argument. This allows you to pass the `Context` to your dependencies:

```tsx
Container.register("users", (context) => new UsersService(context)) // => Container
```
The `Context` that's sent to the dependency will be fully setup.

**TypeScript**

This works out of the box for JavaScript users, but what about TypeScript users? The first thing you'll run into is that while the `Context` is fully resolved, TypeScript doesn't yet know about all of the registrations. For instance, the following results in a compiler error:

```tsx
const context = Container.new()
  .register("tasksCreator", (context) => new TasksCreator(context))
  // Argument of type '{}' is not assignable to parameter of type 'AppContext'.
  // Type '{}' is missing the following properties from type 'AppContext': tasks, tasksCreator
  .register("tasks", (context) => new SQLiteTaskStore(context))
```
This is because `TasksCreator` is asking for a fully typed context but the context at the time of registration is empty (`{}`). There's two main ways to overcome this:

* If you prefer to keep a static type with your dependencies explicitly listed out, use `Container.new<YourContext>()` when creating the container to explicitly define the context from the beginning.
* Use `Container.singleton` which handles this out of the box. You can read more about it in the [Singletons](#Container.singleton) section.

#### `Container.singleton`

Your goal will often be to pass in the fully resolved `Context` to classes. For this reason `nwire` provides a function that will create a new instance of your class with a fully resolved `Context` whenever the dependency is resolved:

```tsx
Container.new().singleton("users", UsersService) // => Container
```

Now when `context.users` is accessed, `nwire` will call `new UsersService(context)` where `context` is a fully resolved context from your `Container`. It'll take the resulting instance and register it under the `users` name as a singleton. Follow-up calls will access the singleton instance that was created with the dependency was first resolved.

Using `single`
This avoids the TypeScript typing issues as the interface expects the `Container` to be fully registered at the time of resolution.


```tsx
const user = await context.users.findOne("123")

// Equivalent without nwire, sans singleton setup:
const users = new UsersService(container.context())
const user = await users.findOne("123")
```

You can also pass in additional arguments to the constructor:

```tsx
Container.new().singleton("users", UsersService, { cookieSecret: process.env.COOKIE_SECRET })
```

#### `Container.instance` [deprecated]

An alias for `Container.singleton`.


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
  .group("services", (services) =>
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
// Two containers are used for resolution here: the root container and the nested `services` container
context.services.users.findOne("123")
```

### `Context`

The `Context` class is the proxy that the `Container` produces. This class allows you to access your dependencies using the names you registered them with:

```tsx
const context = Container.new()
  .register("users" /** Registry name */, () => new UsersService())
  .context() // Proxy created at this point

const user = await context.users.findOne("123")
```

The object returned by `Context` is a shallow object one-level deep with getters. For instance, considering the following type:

```tsx
type AppContext = {
  services: {
    users: UsersService
    tasks: TasksService
  },
  events: {
    profileUpdated: ProfileUpdatedEvent
  }
}
```

The shallow object returned by `Context` will be:

```tsx
{ services: [Getter], events: [Getter] }
```

It's designed like this to circumvent situations where the underlying operations done to your packages could enumerate them.

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

Doing so helps you avoid circular dependencies.

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

There is currently no API for transient `instance` registrations, so if you do want to create a unique instance on every call you'll need to do it using `register`:

```tsx
const context = Container.new<AppContext>()
  .register("users", (context) => new UsersService(context), { transient: true }))
  .context()
```

### `Service`

Generally you want to pass your `Context` around to all of your class constructors and services to enable the lazy resolution of dependencies. You can do this manually by passing the `Context` as the first argument to your constructor:

```ts
export class MyService {
  constructor(protected context: MyTypedContext) {}
}
```

Now you can register the `MyService` class in `nwire` as a `singleton` and `nwire` will take care of the rest.

This will work fine for a while but then you'll run into several issues:

* You'll have to remember to instrument the `Context` around to all of your dependencies
* You'll need to call `this.context` to access your dependencies every time, which looks very verbose 
* `this.context` lives in the class and can be replaced at any moment. 

To overcome these challenges you'll eventually land on a pattern that looks like this:

```tsx
export class Service {
  constructor(private _context: MyTypedContext) {}
  
  // No longer possible to clobber `context`
  get context() {
    return this._context
  }

  // Can use `this.users` instead of `this.context.users`
  get users() {
    return this.context.users
  }
}

export class MyService extends Service {
  // Optional constructor but you'll need to remember it in situations where arguments are involved
  constructor(private _context: MyTypedContext, private serviceName: string) {
    super(_context)
    // Do something with `serviceName`
  }
}
```

This works, but again you'll outgrow this once you add more dependencies and your container gets more complex.

For this reason `nwire` provides a base class named `Service` which takes care of all of these concerns for you:

```tsx
import { Service } from "nwire"

export class MyService extends Service<MyTypedContext>() { // Note the parens
  helloWorld() {
    return this.context.banner;
  }
}
```

Classes that extend the `Service` class will fit neatly into the `Container.prototype.singleton` API:

```tsx
const context = Container.new()
  .register("banner", () => "Hello world!")
  .singleton("my", MyService) // No type errors
  .context()

context.my.helloWorld() // => console output: "Hello world!"
```

`Service` is a class factory that will take your `Context` and create getters for it. This way you don't have to write `context` getters for all of your dependencies:

```tsx
export class UsersService extends Service<MyTypedContext>() {
  async findOne(id: string) {
    // No need to call `this.context.prisma.users.findOne`
    return await this.db.users.findOne({ where: { id } })
  }
}

export class UserUpdaterService extends Service<MyTypedContext>() {
  async update(id: string, name: string) {
    const existingUser = await this.users.findOne(id)
    if (!existingUser) throw new Error("User not found")
    return await this.db.users.update({ where: { id }, data: { name }})
  }
}

const context = Container.new()
  .singleton("users", UsersService)
  .singleton("userUpdater", UserUpdaterService)
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
