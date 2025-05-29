import { SeafarerClient } from "./SeafarerClient"

// This ensures the page can be statically generated
export function generateStaticParams() {
  return []
}

// This tells Next.js to use static rendering
export const dynamic = 'force-static'

export default function SeafarerDetailsPage() {
  return <SeafarerClient />
} 