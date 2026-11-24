/**
 * Photo behind the auth forms (Auth2.jpg re-toned to the app palette and
 * compressed). It covers the whole page; the form card sits in the middle.
 */
export function AuthBackground() {
  return (
    <div aria-hidden="true" className="absolute inset-0 -z-10 overflow-hidden bg-[#EEEADF]">
      <img
        src="/Images/auth-bg.webp"
        alt=""
        className="h-full w-full object-cover object-bottom"
      />
    </div>
  )
}
