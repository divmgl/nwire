import { Container, Service } from "nwire"

type MyContext = {
  banner: string
  my: MyService
}

export class MyService extends Service<MyContext>() {
  helloWorld() {
    return this.banner
  }
}

const context = Container.new()
  .register("banner", () => "Hello world!")
  .instance("my", MyService)
  .context()

console.log(context.my.helloWorld()) // => console output: "Hello world!"
