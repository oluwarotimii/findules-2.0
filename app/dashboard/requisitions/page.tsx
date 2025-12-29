import { Banknote } from 'lucide-react'

export default function RequisitionsPage() {
    return (
        <div className="flex flex-col items-center justify-center h-[60vh] text-center">
            <div className="p-6 bg-[color:var(--success)/.1] rounded-full mb-6">
                <Banknote className="w-12 h-12 text-[color:var(--success)]" />
            </div>
            <h1 className="text-2xl font-bold text-[color:var(--card-foreground)] mb-2">Cash Requisitions</h1>
            <p className="text-[color:var(--muted-foreground)] max-w-md">
                This module is currently under development. You will soon be able to manage cash requests and approvals here.
            </p>
        </div>
    )
}
