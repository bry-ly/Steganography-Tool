import defaultMdxComponents from "fumadocs-ui/mdx";
import type { MDXComponents } from "mdx/types";
import { Tab, Tabs } from "fumadocs-ui/components/tabs";
import { CodeBlock, Pre } from "fumadocs-ui/components/codeblock";
import { Step, Steps } from "fumadocs-ui/components/steps";
import { Callout } from "fumadocs-ui/components/callout";
import { File, Folder, Files } from "fumadocs-ui/components/files";
import { Card } from "fumadocs-ui/components/card";

function IconTextAa(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" fill="currentColor" {...props}>
      <path d="M205.66 90.34a8 8 0 0 0-11.32 0L176 108.69l-18.34-18.35a8 8 0 0 0-11.32 11.32l18.35 18.34-18.34 18.34a8 8 0 0 0 11.32 11.32L176 131.31l18.34 18.35a8 8 0 0 0 11.32-11.32L187.31 120l18.35-18.34a8 8 0 0 0 0-11.32ZM128 184H48a8 8 0 0 0 0 16h80a8 8 0 0 0 0-16Zm-8-56H48a8 8 0 0 0 0 16h72a8 8 0 0 0 0-16Zm-8-32H48a8 8 0 0 0 0 16h64a8 8 0 0 0 0-16Z" />
    </svg>
  );
}

function IconImage(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" fill="currentColor" {...props}>
      <path d="M216 40H40a16 16 0 0 0-16 16v144a16 16 0 0 0 16 16h176a16 16 0 0 0 16-16V56a16 16 0 0 0-16-16Zm0 160H40V56h176ZM56 72a8 8 0 0 1 8-8h16a8 8 0 0 1 0 16H64a8 8 0 0 1-8-8Zm112 80.58l-39.06-39.06a8 8 0 0 0-11.31 0L96 159.17 72.67 135.83a8 8 0 0 0-11.34 0L40 157.16V184h176v-22.59Z" />
    </svg>
  );
}

function IconLock(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" fill="currentColor" {...props}>
      <path d="M208 88h-8V56a48 48 0 0 0-96 0v32h-8a16 16 0 0 0-16 16v112a16 16 0 0 0 16 16h128a16 16 0 0 0 16-16V104a16 16 0 0 0-16-16ZM120 56a32 32 0 0 1 64 0v32H120Zm72 144H64V104h128Z" />
    </svg>
  );
}

function IconPackage(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" fill="currentColor" {...props}>
      <path d="M222.86 107.53l-88.86-49.29a15.89 15.89 0 0 0-14 0l-88.86 49.29A16 16 0 0 0 24 121.59v52.82a16 16 0 0 0 8.86 14.06l88.86 49.29a15.89 15.89 0 0 0 14 0l88.86-49.29A16 16 0 0 0 232 174.41v-52.82a16 16 0 0 0-7.14-14.06ZM120 191.42V126.27l64 35.79ZM56 129.23l64 35.79v65.16ZM120 56l80 44.67-32 17.89-64-35.79Zm-8 44.67L48 56l32-17.89Z" />
    </svg>
  );
}

function IconMoon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" fill="currentColor" {...props}>
      <path d="M233.54 142.23a8 8 0 0 0-8-2 88.08 88.08 0 0 1-106.8-106.8 8 8 0 0 0-10-10 104.84 104.84 0 0 0-52.91 17A104 104 0 1 0 234 158a8.08 8.08 0 0 0-2.46-15.77Z" />
    </svg>
  );
}

function IconGlobe(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" fill="currentColor" {...props}>
      <path d="M128 24a104 104 0 1 0 104 104A104.11 104.11 0 0 0 128 24Zm-18.54 184.36A87.64 87.64 0 0 1 40 128a87.78 87.78 0 0 1 2.37-21.58 8 8 0 0 1 12.34-2.43A71.82 71.82 0 0 0 56 128a71.53 71.53 0 0 0 .36 7.79 8 8 0 0 1-4.54 8.47Zm126.68-5.4a7.89 7.89 0 0 1-7.42 5.23 87.42 87.42 0 0 1-72-40.73 8 8 0 0 1 13.84-7.92 71.57 71.57 0 0 0 59.59 33.31 7.89 7.89 0 0 1 6 10.11ZM216 128a87.53 87.53 0 0 1-3.26 24.29 8 8 0 0 1-9.64 5.14 71.87 71.87 0 0 0-38.54-22.29A87.64 87.64 0 0 1 128 40a87.84 87.84 0 0 1 86.37 72.43 8 8 0 0 1-7.22 8.71A8.37 8.37 0 0 1 208 120.7Z" />
    </svg>
  );
}

export function getMDXComponents(components?: MDXComponents) {
  return {
    ...defaultMdxComponents,
    pre: ({ ref: _ref, ...props }) => (
      <CodeBlock>
        <Pre {...props}>{props.children}</Pre>
      </CodeBlock>
    ),
    Tabs,
    Tab,
    Steps,
    Step,
    Callout,
    Files,
    Folder,
    File,
    Card,
    IconTextAa,
    IconImage,
    IconLock,
    IconPackage,
    IconMoon,
    IconGlobe,
    ...components,
  } satisfies MDXComponents;
}

export const useMDXComponents = getMDXComponents;

declare global {
  type MDXProvidedComponents = ReturnType<typeof getMDXComponents>;
}
