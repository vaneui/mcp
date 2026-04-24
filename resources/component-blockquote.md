# Blockquote

Quoted content with left-border accent. Inherits ancestor appearance.

Source: `vaneui-web/app/docs/data/typography-components/blockquote.tsx` —
live demos at https://vaneui.com/docs/typography-components/blockquote

## Basic Usage

Display a styled quotation with a left border accent. Blockquote inherits appearance from the parent by default.

```tsx
<Col>
  <Blockquote>The only way to do great work is to love what you do.</Blockquote>
  <Blockquote>Design is not just what it looks like and feels like. Design is how it works.</Blockquote>
</Col>
```

## Appearances

Apply appearance props to color the blockquote. The default is `inherit`, which picks up the parent color.

```tsx
<Col>
  {
    ['primary', 'brand', 'accent', 'secondary', 'success', 'danger', 'warning', 'info'].map((key) => (
      <Blockquote key={key} {...{[key]: true}}>
        {key.charAt(0).toUpperCase() + key.slice(1)} appearance blockquote.
      </Blockquote>
    ))
  }
</Col>
```

## Sizes

Blockquote supports five sizes: `xs`, `sm`, `md` (default), `lg`, `xl`.

```tsx
<Col>
  {
    ComponentKeys.size.map((key) => (
      <Blockquote key={key} {...{[key]: true}} primary>
        Size {key}: The best way to predict the future is to create it.
      </Blockquote>
    ))
  }
</Col>
```

## Inside a Card

Blockquote inherits the parent appearance, making it blend seamlessly inside themed containers.

```tsx
<Row flexWrap>
  <Card primary>
    <Blockquote>Inherits primary from the card.</Blockquote>
  </Card>
  <Card success>
    <Blockquote>Inherits success from the card.</Blockquote>
  </Card>
  <Card danger>
    <Blockquote>Inherits danger from the card.</Blockquote>
  </Card>
</Row>
```

## With Rich Content

Blockquotes can contain multiple paragraphs and nested components.

```tsx
<Blockquote primary>
  <Text bold>Steve Jobs</Text>
  <Text>Innovation distinguishes between a leader and a follower. Stay hungry, stay foolish.</Text>
</Blockquote>
```

## Testimonial Pattern

Use blockquotes with attribution for testimonials and customer quotes.

```tsx
<Col>
  <Blockquote brand>
    <Text italic>VaneUI made our design system migration incredibly smooth. The boolean props API is intuitive and the theming is powerful.</Text>
    <Text sm bold>— Sarah Chen, Lead Engineer</Text>
  </Blockquote>
  <Blockquote success>
    <Text italic>We shipped our new dashboard in half the time thanks to VaneUI components.</Text>
    <Text sm bold>— Alex Rivera, Product Manager</Text>
  </Blockquote>
</Col>
```

## Variants

Use `filled` for solid background blockquotes or `outline` (default) for the left-border accent style.

```tsx
<Col>
  <Blockquote primary>Outline (default) — with a left border accent.</Blockquote>
  <Blockquote primary filled>Filled — solid background for emphasis.</Blockquote>
  <Blockquote info>Outline info — informational note.</Blockquote>
  <Blockquote info filled>Filled info — strong callout.</Blockquote>
</Col>
```
