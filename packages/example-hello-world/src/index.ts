import { Container, Injected } from "nwire"

type MyTypedContext = {
  banner: string
  my: MyService
}

export class MyService extends Injected<MyTypedContext> {
  helloWorld() {
    return this.context.banner
  }
}

const context = Container.register("banner", () => "Hello world!")
  .instance("my", MyService)
  .context()

console.log(context.my.helloWorld()) // => console output: "Hello world!"
