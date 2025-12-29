// Simple script to initialize branch balances via API
// Run this in your browser console while logged in as MANAGER

async function initializeBranchBalances() {
    const token = localStorage.getItem('token');
    
    if (!token) {
        console.error('❌ Not logged in! Please login first.');
        return;
    }

    console.log('🔍 Fetching branches...');
    
    // First, get all branches
    const branchesRes = await fetch('/api/branches', {
        headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (!branchesRes.ok) {
        console.error('❌ Failed to fetch branches');
        return;
    }
    
    const branches = await branchesRes.json();
    console.log(`✓ Found ${branches.length} branches`);
    
    // Initialize each branch with 100,000 NGN
    const defaultAmount = 100000;
    
    for (const branch of branches) {
        console.log(`\n💰 Initializing ${branch.branchName}...`);
        
        try {
            const res = await fetch('/api/branch-balance', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    branchId: branch.branchId,
                    amount: defaultAmount,
                    notes: 'Initial opening balance'
                })
            });
            
            const data = await res.json();
            
            if (res.ok) {
                console.log(`✅ ${branch.branchName}: ₦${defaultAmount.toLocaleString()}`);
            } else {
                console.log(`ℹ️  ${branch.branchName}: ${data.error || 'Already initialized'}`);
            }
        } catch (error) {
            console.error(`❌ ${branch.branchName}: Error -`, error.message);
        }
    }
    
    console.log('\n🎉 Done! Refresh the Branch Balance page to see the results.');
}

// Run the initialization
initializeBranchBalances();




// async function initializeBranchBalances() {
//     const token = localStorage.getItem('token');
//     console.log('🔍 Fetching branches...');
    
//     const branchesRes = await fetch('/api/branches', {
//         headers: { 'Authorization': `Bearer ${token}` }
//     });
    
//     const branches = await branchesRes.json();
//     console.log(`✓ Found ${branches.length} branches`);
    
//     const defaultAmount = 100000; // 100,000 NGN per branch
    
//     for (const branch of branches) {
//         console.log(`💰 Initializing ${branch.branchName}...`);
        
//         const res = await fetch('/api/branch-balance', {
//             method: 'POST',
//             headers: {
//                 'Authorization': `Bearer ${token}`,
//                 'Content-Type': 'application/json'
//             },
//             body: JSON.stringify({
//                 branchId: branch.branchId,
//                 amount: defaultAmount,
//                 notes: 'Initial opening balance'
//             })
//         });
        
//         const data = await res.json();
//         console.log(res.ok ? `✅ ${branch.branchName}: ₦${defaultAmount.toLocaleString()}` : `ℹ️ ${branch.branchName}: ${data.error}`);
//     }
    
//     console.log('🎉 Done! Refresh the page.');
// }

// initializeBranchBalances();