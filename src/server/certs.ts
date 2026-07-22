"use server";

import { revalidatePath } from "next/cache";
import { asc, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { certificates } from "@/db/schema";

export async function getCertificates() {
  return db
    .select()
    .from(certificates)
    .orderBy(asc(certificates.status), asc(certificates.targetDate));
}

const certSchema = z.object({
  name: z.string().min(1).max(300),
  provider: z.string().max(200).optional(),
  url: z.string().url().max(1000).optional().or(z.literal("")),
  targetDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional()
    .or(z.literal("")),
  notes: z.string().max(4000).optional(),
});

export async function createCertificate(formData: FormData) {
  const parsed = certSchema.parse({
    name: formData.get("name"),
    provider: formData.get("provider") || undefined,
    url: formData.get("url") || "",
    targetDate: formData.get("targetDate") || "",
    notes: formData.get("notes") || undefined,
  });
  await db.insert(certificates).values({
    name: parsed.name,
    provider: parsed.provider ?? null,
    url: parsed.url || null,
    targetDate: parsed.targetDate || null,
    notes: parsed.notes ?? null,
  });
  revalidatePath("/certs");
}

const progressSchema = z.object({
  percentComplete: z.coerce.number().int().min(0).max(100),
});

export async function updateCertificateProgress(id: number, formData: FormData) {
  const { percentComplete } = progressSchema.parse({
    percentComplete: formData.get("percentComplete"),
  });
  await db
    .update(certificates)
    .set({
      percentComplete,
      status: percentComplete >= 100 ? "completed" : "in_progress",
    })
    .where(eq(certificates.id, id));
  revalidatePath("/certs");
}

export async function deleteCertificate(id: number) {
  await db.delete(certificates).where(eq(certificates.id, id));
  revalidatePath("/certs");
}
