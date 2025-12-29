import { Fuel } from 'lucide-react'

export default function FuelPage() {
    return (
        <div className="flex flex-col items-center justify-center h-[60vh] text-center">
            <div className="p-6 bg-[color:var(--warning)/.1] rounded-full mb-6">
                <Fuel className="w-12 h-12 text-[color:var(--warning)]" />
            </div>
            <h1 className="text-2xl font-bold text-[color:var(--card-foreground)] mb-2">Fuel Management</h1>
            <p className="text-[color:var(--muted-foreground)] max-w-md">
                This module is currently under development. You will soon be able to issue fuel coupons and track usage here.
            </p>
        </div>
    )
}
