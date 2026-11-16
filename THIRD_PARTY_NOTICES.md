# Third-party notices

This maintained fork includes upstream work from
[`viclafouch/mui-otp-input`](https://github.com/viclafouch/mui-otp-input),
originally authored by Victor de la Fouchardiere and distributed under the MIT
License.

The per-cell `/base-ui` runtime uses `@base-ui/react`, maintained by the MUI
team and distributed under the MIT License. The optional Material UI adapter
uses `@mui/material` and Emotion, also under their respective MIT licenses. The
optional form adapters use React Hook Form under the MIT License.

No source from the official shadcn registry is copied. The `/shadcn` entrypoint
uses the current public composition names over the package's own single-input
runtime.

That single-input runtime (`src/input-otp.tsx`) adapts techniques from
[`input-otp`](https://github.com/guilhermerodz/input-otp) by Guilherme Rodz,
distributed under the MIT License: one transparent input over drawn cells, the
selection-to-cell mapping that turns a caret inside the value into a
one-character selection, the injected `::selection`/`:autofill` rules, and the
password-manager badge detection and gutter.

```
MIT License

Copyright (c) 2024 Guilherme Rodz

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```
