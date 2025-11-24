import { Banknote } from 'lucide-react'

export default function RequisitionsPage() {
    return (
        <div className="flex flex-col items-center justify-center h-[60vh] text-center">
            <div className="p-6 bg-green-100 rounded-full mb-6">
                <Banknote className="w-12 h-12 text-green-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-800 mb-2">Cash Requisitions</h1>
            <p className="text-gray-500 max-w-md">
                This module is currently under development. You will soon be able to manage cash requests and approvals here.
            </p>
        </div>
    )
}
