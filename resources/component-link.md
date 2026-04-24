# Link

Hyperlink (<a>). Underline + link appearance (blue) by default. external prop auto-sets target=_blank + rel=noopener.

Source: `vaneui-web/app/docs/data/typography-components/link.tsx` —
live demos at https://vaneui.com/docs/typography-components/link

## Basic Link

A styled anchor element for navigation. Unlike other typography components which default to `inherit`, Link defaults to the `link` appearance (blue color) with `underline`.

```tsx
<Link href="#">Click here to learn more</Link>
```

## Link Sizes

Links come in different sizes: `xs`, `sm`, `md` (default), `lg`, `xl`.

```tsx
<Col>
  <Link sm href="#">Small link</Link>
  <Link href="#">Medium link (default)</Link>
  <Link lg href="#">Large link</Link>
</Col>
```

## Link Appearances

Links default to the `link` appearance (blue). Override with: `primary`, `brand`, `accent`, `secondary`, `tertiary`, `success`, `danger`, `warning`, `info`.

```tsx
<Row flexWrap>
  <Link primary href="#">Primary</Link>
  <Link brand href="#">Brand</Link>
  <Link accent href="#">Accent</Link>
  <Link secondary href="#">Secondary</Link>
  <Link success href="#">Success</Link>
  <Link danger href="#">Danger</Link>
  <Link warning href="#">Warning</Link>
  <Link info href="#">Info</Link>
</Row>
```

## Link Variants

Use `filled` for solid background links or `outline` for bordered links.

```tsx
<Row flexWrap>
  <Link primary filled href="#">Filled Primary</Link>
  <Link success filled href="#">Filled Success</Link>
  <Link danger filled href="#">Filled Danger</Link>
  <Link primary outline href="#">Outline Primary</Link>
  <Link secondary outline href="#">Outline Secondary</Link>
</Row>
```

## Link Styling

Use `bold`, `semibold`, `italic`, and text decorations like `underline` or `noUnderline`.

```tsx
<Col>
  <Link bold href="#">Bold link</Link>
  <Link semibold href="#">Semibold link</Link>
  <Link italic href="#">Italic link</Link>
  <Link noUnderline href="#">Link without underline</Link>
</Col>
```

## Link in Context

Links integrate naturally with other text content.

```tsx
<Text>
  Check out our <Link href="#">documentation</Link> to learn more about the features.
  You can also visit the <Link href="#">GitHub repository</Link> for source code.
</Text>
```

## With Icons

Combine links with icons using Row for visual navigation cues.

```tsx
<Col>
  <Row itemsCenter>
    <ExternalLink size={14} />
    <Link href="#">Open in new window</Link>
  </Row>
  <Row itemsCenter>
    <FileText size={14} />
    <Link href="#">View documentation</Link>
  </Row>
  <Row itemsCenter>
    <GitHub size={14} />
    <Link href="#">Source on GitHub</Link>
  </Row>
</Col>
```

## Sizes in Context

Different link sizes alongside matching text.

```tsx
<Col>
  <Text sm>Read the <Link sm href="#">terms and conditions</Link> before proceeding.</Text>
  <Text>Visit our <Link href="#">help center</Link> for more information.</Text>
  <Text lg>Check out the <Link lg href="#">getting started guide</Link> to begin.</Text>
</Col>
```
