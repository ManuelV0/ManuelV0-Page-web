// app/autori/[id]/page.tsx
import { createClient } from '@/lib/supabaseServer' // client server-side (cookies)
export default async function Autore({ params:{id} }:{params:{id:string}}) {
  const supabase = createClient()
  const [{ data: prof }, { data: hist }] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', id).single(),
    supabase.from('diario_autore_history').select('contenuto,created_at').eq('author_id', id).order('created_at',{ascending:false})
  ])
  // render prof + timeline history
}
