import defaultMdxComponents from "fumadocs-ui/mdx";
import type { MDXComponents } from "mdx/types";
import { Tab, Tabs } from "fumadocs-ui/components/tabs";
import { CodeBlock, Pre } from "fumadocs-ui/components/codeblock";
import { Step, Steps } from "fumadocs-ui/components/steps";
import { Callout } from "fumadocs-ui/components/callout";
import { File, Folder, Files } from "fumadocs-ui/components/files";
import { Card } from "fumadocs-ui/components/card";
import { Accordion, Accordions } from "fumadocs-ui/components/accordion";
import { TypeTable } from "fumadocs-ui/components/type-table";

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

function IconShieldCheck(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" fill="currentColor" {...props}>
      <path d="M208 40H48a16 16 0 0 0-16 16v58.78c0 89.61 75.82 119.34 91 124.39a15.53 15.53 0 0 0 10 0c15.2-5.05 91-34.78 91-124.39V56a16 16 0 0 0-16-16Zm-50.34 74.34-56 56a8 8 0 0 1-11.32 0l-24-24a8 8 0 0 1 11.32-11.32L96 153.37l50.34-50.35a8 8 0 0 1 11.32 11.32Z" />
    </svg>
  );
}

function IconBook(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" fill="currentColor" {...props}>
      <path d="M224 48h-64a40 40 0 0 0-32 16 40 40 0 0 0-32-16H32a8 8 0 0 0-8 8v144a8 8 0 0 0 8 8h64a24 24 0 0 1 24 24 8 8 0 0 0 16 0 24 24 0 0 1 24-24h64a8 8 0 0 0 8-8V56a8 8 0 0 0-8-8ZM96 192H40V64h56a24 24 0 0 1 24 24v112a39.81 39.81 0 0 0-24-8Zm120 0h-56a39.81 39.81 0 0 0-24 8V88a24 24 0 0 1 24-24h56Z" />
    </svg>
  );
}

function IconCode(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" fill="currentColor" {...props}>
      <path d="M69.12 132.23 40 162.34l29.12 30.11a8 8 0 1 1-11.7 10.91l-35.07-36.27a8 8 0 0 1 0-11.32L57.42 119.5a8 8 0 0 1 11.7 10.91Zm162.68-1.18 35.07 36.27a8 8 0 0 1 0 11.32l-35.07 36.27a8 8 0 0 1-11.7-10.91L249.05 162.34l-29.12-30.11a8 8 0 1 1 11.7-10.91Zm-64.84 89.18a8 8 0 0 1-10.6-4.18L116.18 116.2a8 8 0 0 1 14.78-6.43l40.18 99.86a8 8 0 0 1-4.18 10.6Z" />
    </svg>
  );
}

function IconEyeOff(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" fill="currentColor" {...props}>
      <path d="M53.92 34.62a8 8 0 1 0-11.84 10.76l19.24 21.17C41.5 77.43 26.31 94.18 13.09 116.18a8 8 0 0 0 .61 9.42C34.77 154.2 70.2 184 128 184a130 130 0 0 0 39-6l25.07 27.58a8 8 0 1 0 11.84-10.76ZM128 168c-29.83 0-54-19-66.83-37.26 7.69-12 19.49-26.93 35.16-37.26l12.31 13.5a32 32 0 0 0 46.37 46.37l-1.43-1.57c-.13 1.06-.31 2.1-.51 3.13A32 32 0 0 1 128 168Z" />
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
    Accordion,
    Accordions,
    TypeTable,
    IconTextAa,
    IconImage,
    IconLock,
    IconPackage,
    IconMoon,
    IconGlobe,
    IconShieldCheck,
    IconBook,
    IconCode,
    IconEyeOff,
    ...components,
  } satisfies MDXComponents;
}

export const useMDXComponents = getMDXComponents;

declare global {
  type MDXProvidedComponents = ReturnType<typeof getMDXComponents>;
}
