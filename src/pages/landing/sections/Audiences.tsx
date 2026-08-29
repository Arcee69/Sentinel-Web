import {Card, Container} from "../ui";
import { accentAt } from "../accents";

const AUDIENCES = [
  "Political Strategists",
  "Campaign Teams",
  "Media Organisations",
  "Policy Institutions",
  "Election Observers",
  "Analysts",
  "Civil Society",
  "Decision Makers",
];

/** Strip naming who the platform is built for. */
export default function Audiences() {
  return (
    <section className="border-t border-l-border bg-l-background py-16">
      <Container>
        <p className="mx-auto max-w-2xl text-center font-l-sans text-[17px] leading-[1.6] text-l-foreground">
          Built for the people who need to understand what is happening —{" "}
          <span className="text-l-muted-foreground">before it becomes obvious.</span>
        </p>

        <ul className="mt-10 grid grid-cols-2 gap-3 lg:grid-cols-4">
          {AUDIENCES.map((name, i) => (
            <li key={name}>
              <Card accent={accentAt(i)} className="h-full px-4 py-4">
                <p className="font-mono text-[10px] tracking-[0.16em] text-l-ember-ink">
                  {String(i + 1).padStart(2, "0")}
                </p>
                <p className="mt-2 font-l-sans text-[14px] leading-tight text-l-foreground">
                  {name}
                </p>
              </Card>
            </li>
          ))}
        </ul>
      </Container>
    </section>
  );
}
