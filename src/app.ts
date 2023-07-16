import express, { Application , Request, Response} from 'express';

const app: Application = express()

const port: number = 8000

app.get('/test', (req: Request, res: Response) => {
  res.send('Hello world!')
})

app.listen(port, function () {
  console.log(`App is listening on port ${port} !`)
})