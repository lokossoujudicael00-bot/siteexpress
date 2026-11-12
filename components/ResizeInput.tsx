"use client";
import { useRef } from "react";

// Champ photo : réduit automatiquement l'image avant l'envoi (les photos de téléphone sont trop lourdes)
export default function ResizeInput({ name }: { name: string }) {
  const ref = useRef<HTMLInputElement>(null);
  async function onChange(e: any) {
    const f: File | undefined = e.target.files && e.target.files[0];
    if (!f || !f.type.startsWith("image/")) return;
    try {
      const bmp = await createImageBitmap(f);
      const k = Math.min(1, 1400 / Math.max(bmp.width, bmp.height));
      const cv = document.createElement("canvas");
      cv.width = Math.round(bmp.width * k);
      cv.height = Math.round(bmp.height * k);
      const ctx = cv.getContext("2d");
      if (!ctx) return;
      ctx.drawImage(bmp, 0, 0, cv.width, cv.height);
      const blob: Blob | null = await new Promise((r) => cv.toBlob(r, "image/jpeg", 0.82));
      if (!blob) return;
      const dt = new DataTransfer();
      dt.items.add(new File([blob], "photo.jpg", { type: "image/jpeg" }));
      if (ref.current) ref.current.files = dt.files;
    } catch {}
  }
  return <input ref={ref} type="file" name={name} accept="image/*" onChange={onChange} />;
}
