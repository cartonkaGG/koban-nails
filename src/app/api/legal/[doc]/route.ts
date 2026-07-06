import { NextResponse } from "next/server";
import { isLegalDocSlug, legalDocuments } from "@/content/legal-documents";
import { generateLegalPdf } from "@/lib/legal-pdf";

type Params = { params: Promise<{ doc: string }> };

export async function GET(_request: Request, { params }: Params) {
  const { doc } = await params;

  if (!isLegalDocSlug(doc)) {
    return NextResponse.json({ error: "Документ не знайдено" }, { status: 404 });
  }

  const definition = legalDocuments[doc];

  try {
    const pdfBytes = await generateLegalPdf({
      title: definition.title,
      subtitle: definition.subtitle,
      sections: definition.sections,
    });

    return new NextResponse(Buffer.from(pdfBytes), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${definition.filename}"`,
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch (error) {
    console.error("legal pdf:", error);
    return NextResponse.json({ error: "Не вдалося згенерувати PDF" }, { status: 500 });
  }
}
