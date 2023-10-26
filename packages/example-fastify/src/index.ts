import { createServer } from "./createServer"
import { createContext } from "./AppContext"

start()

// Can use top-level `await` in ESM.
async function start() {
  try {
    const server = createServer(await createContext())

    server.listen({ port: 3000 }, (err, address) => {
      if (err) {
        console.error(err)
        process.exit(1)
      }

      console.info(`Server listening at ${address}`)
    })

    return server
  } catch (err) {
    console.error(err)
    process.exit(1)
  }
}
