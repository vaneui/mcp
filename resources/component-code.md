# Code

Inline code span. Monospace, rounded, with padding.

Source: `vaneui-web/app/docs/data/basic-components/code.tsx` —
live demos at https://vaneui.com/docs/basic-components/code

## Basic Usage

Inline code snippets with default styling.

```tsx
<Row flexWrap>
  <span>Use the <Code>npm install</Code> command to install packages.</span>
  <span>The <Code>{"const variable = 'value'"}</Code> syntax declares a constant.</span>
</Row>
```

## Sizes

Code elements in different sizes - `xs`, `sm`, `md`, `lg`, `xl`.

```tsx
<Col>
  {
    ComponentKeys.size.map((key: string) => (
      <Row key={key}>
        <span>Size {key}: <Code {...{[key]: true}}>{"console.log('Hello')"}</Code></span>
      </Row>
    ))
  }
</Col>
```

## Appearances

Different code color variants for syntax highlighting.

```tsx
<Row flexWrap>
  {
    ComponentKeys.appearance.map((key: string) => (
      <Code key={key} {...{[key]: true}}>
        {key} code
      </Code>
    ))
  }
</Row>
```

## Code in Context

Code elements used within text content.

```tsx
<Col>
  <Text>
    To create a new React component, use <Code>{"function Component() {}"}</Code> or
    the arrow function syntax <Code>{"const Component = () => {}"}</Code>.
  </Text>
  <p>
    Install the package with <Code primary>npm i @vaneui/ui</Code> and then
    import it using <Code secondary>{'import { Button } from "@vaneui/ui"'}</Code>.
  </p>
  <Text>
    The <Code info>useState</Code> hook returns an array with two elements:
    the current state value and a setter function like <Code info>[state, setState]</Code>.
  </Text>
</Col>
```

## Keyboard Shortcuts

Code elements for displaying keyboard shortcuts and commands.

```tsx
<Row flexWrap>
  <Text primary>
    <Code>Ctrl</Code>+<Code>C</Code>
  </Text>
  or
  <Text primary>
    <Code primary>Cmd</Code>+<Code primary>V</Code>
  </Text>
</Row>
```

## Filled & Outline Variants

Code defaults to `outline` variant. Use `filled` for stronger visual emphasis.

```tsx
<Col>
  <Text>Default outline: <Code>npm install</Code> then <Code>npm run build</Code></Text>
  <Text>Filled: <Code filled>git commit</Code> then <Code filled>git push</Code></Text>
  <Text>Colored filled: <Code success filled>200 OK</Code> <Code danger filled>500 Error</Code> <Code warning filled>deprecated</Code></Text>
</Col>
```
