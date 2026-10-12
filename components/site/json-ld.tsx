interface JsonLdProps {
  data: object | object[];
}

/** Serializes structured data safely: `<` is escaped so content can't close the script tag. */
export function JsonLd({ data }: JsonLdProps) {
  const json = JSON.stringify(Array.isArray(data) ? { '@context': 'https://schema.org', '@graph': data } : data);
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: json.replace(/</g, '\\u003c') }}
    />
  );
}
