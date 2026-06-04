import { Button } from "@/components/ui/button"

export default function Login() {
  return (
    <div className="min-h-screen bg-[#212856] text-white flex flex-col items-center justify-center gap-6">
      <h1 className="text-4xl font-bold">Hola desde Login</h1>
      <Button variant="secondary" size="lg">Botón Shadcn</Button>
    </div>
  )
}
