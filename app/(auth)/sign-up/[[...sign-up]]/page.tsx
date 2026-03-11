import { SignUp } from '@clerk/nextjs'

export default function Page() {
  return <div className='flex h-full mt-10 item-center justify-center'>
    <SignUp />
  </div>
}