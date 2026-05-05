import express from 'express';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

const app = express();

app.set('view engine', 'ejs');
app.set('views', join(__dirname, '..', 'views'));

app.get('/', (_req, res) => {
  res.render('index');
});

export default app;

if (process.env.NODE_ENV !== 'test') {
  const port = process.env.PORT ?? 3000;
  app.listen(port, () => {
    console.log(`Listening on port ${port}`);
  });
}
