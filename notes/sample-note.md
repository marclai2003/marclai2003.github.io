# Sample note (Markdown + math)

This is a **sample** note for the `/notes` section. It uses [marked](https://marked.js.org/) for Markdown and MathJax for math.

## Inline and display math

The prime number theorem says $\pi(x) \sim \frac{x}{\log x}$ as $x \to \infty$.

Display mode:

$$
\int_{-\infty}^{\infty} e^{-x^2}\,dx = \sqrt{\pi}
$$

Bracket style also works: \[ \sum_{k=1}^n k = \frac{n(n+1)}{2} \]

## Code

```python
def hello():
    print("notes")
```

## Adding a new note

1. Add a file `your-slug.md` in this folder (use letters, numbers, `_`, and `-` in the slug).
2. Add an entry in `notes-manifest.json` (`title`, `sortDate` as `YYYY-MM-DD` for ordering, optional `date` for display, `description`, optional `section`: `homework`, `report`, `papers`, or `other`).
3. Optional: set `detailUrl` to a PDF under `../data/yourfile.pdf` and `detailLabel` (e.g. “View full PDF”) to show a highlighted link on the note page.
4. Open `view.html?note=your-slug`.
