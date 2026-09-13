import Image from "next/image";
import Link from "next/link";

export function Footer() {
  return (
    <footer className="site-footer">
      <div className="footer-inner">
        <div className="footer-brand">
          <Image src="/logo.png" alt="" width={32} height={32} />
          <h2 className="footer-tagline">Make something people (probably) want.</h2>
        </div>

        <div className="footer-cols">
          <div>
            <h3>Programs</h3>
            <ul>
              <li>
                <Link href="/add">The Other 99%</Link>
              </li>
              <li>
                <Link href="/">Startup Directory</Link>
              </li>
              <li>
                <Link href="/jobs">Work at a Startup</Link>
              </li>
              <li>
                <Link href="/add">Pay $20, get listed</Link>
              </li>
            </ul>
          </div>
          <div>
            <h3>Resources</h3>
            <ul>
              <li>
                <Link href="/resources">Resources</Link>
              </li>
              <li>
                <Link href="/library">Library</Link>
              </li>
              <li>
                <Link href="/partners">Partners</Link>
              </li>
              <li>
                <Link href="/jobs">Startup Jobs</Link>
              </li>
            </ul>
          </div>
          <div>
            <h3>Company</h3>
            <ul>
              <li>
                <Link href="/about">About</Link>
              </li>
              <li>
                <Link href="/contact">Contact</Link>
              </li>
              <li>
                <Link href="/privacy">Privacy Policy</Link>
              </li>
              <li>
                <Link href="/terms">Terms of Use</Link>
              </li>
            </ul>
          </div>
        </div>
      </div>
      <div className="footer-bottom">
        <p>© {new Date().getFullYear()} WhyAlligator</p>
      </div>
    </footer>
  );
}
