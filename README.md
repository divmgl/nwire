# nwire

`nwire` is a package that provides simplified dependency injection in Node.js.

```tsx
// entrypoint.ts
import { Container } from "nwire"

const context = Container
  //
  .register("prisma", new PrismaClient())
  .register("redis", new Redis())
  .group("services", (container: Container) =>
    container
      .singleton("users", UsersService)
      .singleton("tasks", TasksService)
      .singleton("billing", BillingService)
  )
  .context()

const myUser = await context.services.users.findOne("1234")
```

```tsx
// UsersService.ts
class UsersService {
  constructor(context: typeof context) {}

  findOne(id: string) {
    return this.context.prisma.users.findUniqueOrThrow({ where: { id } })
  }
}
```

## API

(Coming soon)

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
const context = Container.singleton("users", UsersService)
  .register("prisma", new PrismaClient())
  .register("psql", new Postgres())

const user = await context.users.find("123")
```

`nwire` keeps a list of your registrations and makes them available to your services as needed. When
the `UsersService` calls `users.findOne`, `nwire` will **lazily** return an instance of
`UserRepository`.

> ⚠️ `nwire` contexts are not normal objects. `nwire` use a proxy under the hood to evaluate your dependencies as needed. This is an intentional design decision to avoid having to instantiate the entire `Container` for tests.

## License

MIT
