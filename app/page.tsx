"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { TextEncodeTab } from "@/components/text-encode-tab";
import { TextDecodeTab } from "@/components/text-decode-tab";
import { ImageStegoTab } from "@/components/image-stego-tab";
import { ThemeToggle } from "@/components/theme-toggle";
import { Logo } from "@/components/logo";
import { DEFAULT_SELECTED } from "@/lib/steganography";
import { ImageIcon, LockKeyIcon, LockKeyOpenIcon } from "@phosphor-icons/react";
import Link from "next/link";

export default function Home() {
  const [selectedChars, setSelectedChars] = useState<string[]>(DEFAULT_SELECTED);

  return (
    <div className="flex flex-col min-h-screen">
      <header className="px-6 pt-10 pb-4 max-w-2xl mx-auto w-full">
        <div className="flex items-center justify-between mb-1">
          <Logo size={50} />
          <div className="flex items-center gap-2">
            <Link href="/docs" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Docs
            </Link>
            <ThemeToggle />
          </div>
        </div>
        <p className="text-sm text-muted-foreground">
          Hide secret messages inside plain text or images using steganography. Everything runs in your browser.
        </p>
      </header>

      <Separator className="max-w-2xl mx-auto w-full" />

      <main className="flex-1 px-6 py-6 max-w-2xl mx-auto w-full space-y-6">
        <Tabs defaultValue="encode-text">
          <TabsList className="mb-6 mx-auto">
            <TabsTrigger value="encode-text" className="gap-1.5">
              <LockKeyIcon size={14} /> Encode
            </TabsTrigger>
            <TabsTrigger value="decode-text" className="gap-1.5">
              <LockKeyOpenIcon size={14} /> Decode
            </TabsTrigger>
            <TabsTrigger value="image" className="gap-1.5">
              <ImageIcon size={14} /> Image Stego
            </TabsTrigger>
          </TabsList>

          <TabsContent value="encode-text">
            <TextEncodeTab selectedChars={selectedChars} onSelectedCharsChange={setSelectedChars} />
          </TabsContent>

          <TabsContent value="decode-text">
            <TextDecodeTab selectedChars={selectedChars} onSelectedCharsChange={setSelectedChars} />
          </TabsContent>

          <TabsContent value="image">
            <ImageStegoTab />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
