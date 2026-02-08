# Code Writer (LM Studio)

A small web app that sends your prompt to LM Studio, iterates on code + tests + improvements, and respects a time limit.

## Features
- Prompt + language input.
- Iterative code, test, and improvement loop until time limit.
- Configurable LM Studio base URL, model, and optional API key.

## Getting started

```bash
npm install
npm start
```

Open `http://localhost:3000` in your browser.

## LM Studio setup
1. Start LM Studio and launch the local server.
2. Keep the default base URL (`http://localhost:1234/v1`) or update it in the UI.
3. Pick the model name you have loaded in LM Studio.

## Notes
- This app asks the model to propose tests and improvements. It does not execute tests automatically.
- Iterations stop when the time limit is reached or after 6 iterations.
