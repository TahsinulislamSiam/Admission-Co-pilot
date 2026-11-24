import { cn } from '@/lib/utils'

/**
 * Photo behind the auth forms (Auth2.jpg re-toned to the app palette and
 * compressed). The picture is scaled to the page height and anchored to the
 * bottom, so the tallest books are never cropped. The edge facing the form fades
 * into the wall colour, which also fills any extra width on wide screens.
 * `mirrored` flips it so the books sit on the left (form on the right).
 */
export function AuthBackground({ mirrored = false }) {
  return (
    <div aria-hidden="true" className="absolute inset-0 -z-10 overflow-hidden bg-[#EEEADF]">
      <img
        src="/Images/auth-bg.webp"
        alt=""
        className={cn(
          'absolute bottom-0 h-full w-auto max-w-none [mask-image:linear-gradient(to_right,transparent,black_18%)]',
          mirrored ? 'left-0 -scale-x-100' : 'right-0'
        )}
      />
    </div>
  )
}
