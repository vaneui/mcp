# Mark

Highlighted text. Defaults to warning (yellow) appearance.

Source: `vaneui-web/app/docs/data/basic-components/mark.tsx` —
live demos at https://vaneui.com/docs/basic-components/mark

## Basic Usage

Highlight text with the `Mark` component. Defaults to `warning` (yellow) appearance for a natural highlighter effect.

```tsx
<Row flexWrap>
  <Mark>Highlighted text</Mark>
  <Mark>Important</Mark>
  <Mark>Key term</Mark>
</Row>
```

## Appearances

Different color appearances for highlights.

```tsx
<Row flexWrap>
  {
    ComponentKeys.appearance.slice(0, -1).map((key) => (
      <Mark key={key} {...{[key]: true}}>
        {key.charAt(0).toUpperCase() + key.slice(1)}
      </Mark>
    ))
  }
</Row>
```

## Variants

Mark supports `outline` (default) and `filled` variants.

```tsx
<Col>
  <Row flexWrap>
    <Mark>outline (default)</Mark>
    <Mark primary>primary outline</Mark>
    <Mark success>success outline</Mark>
    <Mark danger>danger outline</Mark>
  </Row>
  <Row flexWrap>
    <Mark filled>filled</Mark>
    <Mark primary filled>primary filled</Mark>
    <Mark success filled>success filled</Mark>
    <Mark danger filled>danger filled</Mark>
  </Row>
</Col>
```

## Sizes

Mark elements in different sizes: `xs`, `sm`, `md` (default), `lg`, `xl`.

```tsx
<Row flexWrap itemsEnd>
  {
    ComponentKeys.size.map((key) => (
      <Col key={key} itemsCenter>
        <Mark {...{[key]: true}}>Marked</Mark>
        <Text sm secondary>{key}</Text>
      </Col>
    ))
  }
</Row>
```

## In Text Context

Mark elements blend naturally within body text for inline highlights.

```tsx
<Col>
  <Text>VaneUI uses a <Mark>boolean props API</Mark> for styling components.</Text>
  <Text>Always wrap your app in <Mark primary>ThemeProvider</Mark> for theming to work.</Text>
  <Text>Components marked with <Mark danger>danger</Mark> indicate destructive actions.</Text>
</Col>
```

## Search Highlight Pattern

Use Mark to highlight search matches within text content.

```tsx
<Col>
  <Text sm secondary>Search results for &quot;React&quot;:</Text>
  <Text>VaneUI is a <Mark>React</Mark> component library built with TypeScript.</Text>
  <Text>All components are <Mark>React</Mark> 19 compatible with server component support.</Text>
  <Text>Use <Mark>React</Mark> hooks like useState with VaneUI form components.</Text>
</Col>
```
