import bcrypt from 'bcryptjs'

// Test password hash
const password = 'password'
const hash = '$2a$10$K7L1OJ45/4Y2nIvhRVpCe.FSmhSrcjqEi.KzY8vD/YX.5hHdBzzRC'

console.log('Testing password hash...')
console.log('Password:', password)
console.log('Hash:', hash)

const isValid = bcrypt.compareSync(password, hash)
console.log('Is valid:', isValid)

// Generate a new hash
const newHash = bcrypt.hashSync(password, 10)
console.log('\nNew hash for "password":', newHash)

// Test the new hash
const isNewValid = bcrypt.compareSync(password, newHash)
console.log('New hash is valid:', isNewValid)
