"use client";

import { ArrowUpRight } from "lucide-react";
import GithubIcon from "@/components/ui/github-icon";
import { useEffect, useMemo, useRef, useState, type CSSProperties, type KeyboardEvent } from "react";
import { profile } from "@/data/portfolio";

type Contribution = { date: string; count: number; level: 0 | 1 | 2 | 3 | 4 };
type ContributionResponse = { contributions: Contribution[] };
type ContributionWeek = (Contribution | null)[];

function makeWeeks(contributions: Contribution[]): ContributionWeek[] {
  const weeks = new Map<string, ContributionWeek>();
  for (const contribution of contributions) {
    const date = new Date(`${contribution.date}T00:00:00Z`);
    const day = date.getUTCDay();
    date.setUTCDate(date.getUTCDate() - day);
    const key = date.toISOString().slice(0, 10);
    const week = weeks.get(key) ?? Array<Contribution | null>(7).fill(null);
    week[day] = contribution;
    weeks.set(key, week);
  }
  return [...weeks.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([, week]) => week);
}

const dateFormat = new Intl.DateTimeFormat("en", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
const monthFormat = new Intl.DateTimeFormat("en", { month: "short", timeZone: "UTC" });
const formatDate = (date: string) => dateFormat.format(new Date(`${date}T00:00:00Z`));

export default function GitHubContributions() {
  const sectionRef = useRef<HTMLElement>(null);
  const calendarRef = useRef<HTMLDivElement>(null);
  const [data, setData] = useState<ContributionResponse | null>(null);
  const [hasError, setHasError] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;
    const controller = new AbortController();
    let timeout: ReturnType<typeof setTimeout> | undefined;
    let cancelled = false;
    let started = false;
    const load = async () => {
      if (started || cancelled) return;
      started = true;
      observer.disconnect();
      timeout = setTimeout(() => controller.abort(), 8000);
      try {
        const response = await fetch("/api/github-contributions", { signal: controller.signal });
        if (!response.ok) throw new Error("Activity unavailable");
        const result = await response.json() as ContributionResponse;
        if (!Array.isArray(result.contributions)) throw new Error("Invalid activity");
        if (!cancelled) setData(result);
      } catch {
        if (!cancelled) setHasError(true);
      } finally {
        clearTimeout(timeout);
      }
    };
    const observer = new IntersectionObserver((entries) => {
      if (entries.some((entry) => entry.isIntersecting)) {
        observer.disconnect();
        void load();
      }
    }, { rootMargin: "320px 0px" });
    observer.observe(section);
    const prepare = () => { void load(); };
    window.addEventListener("portfolio:prepare", prepare, { once: true });
    return () => {
      cancelled = true;
      clearTimeout(timeout);
      controller.abort();
      observer.disconnect();
      window.removeEventListener("portfolio:prepare", prepare);
    };
  }, []);

  const activity = useMemo(() => {
    const days = [...(data?.contributions ?? [])].sort((a, b) => a.date.localeCompare(b.date));
    let longestStreak = 0;
    let streak = 0;
    let previousTime = 0;
    for (const day of days) {
      const time = Date.parse(`${day.date}T00:00:00Z`);
      streak = day.count > 0 ? (time - previousTime === 86400000 ? streak + 1 : 1) : 0;
      longestStreak = Math.max(longestStreak, streak);
      previousTime = time;
    }
    return { days, weeks: makeWeeks(days), total: days.reduce((sum, day) => sum + day.count, 0), activeDays: days.filter((day) => day.count > 0).length, longestStreak, dates: new Map(days.map((day, index) => [day.date, index])) };
  }, [data]);

  const lastDate = activity.days.at(-1)?.date;
  const selected = activity.days[activity.dates.get(selectedDate ?? lastDate ?? "") ?? -1];
  const calendarStyle = { "--calendar-weeks": activity.weeks.length || 53 } as CSSProperties;

  const navigateCalendar = (event: KeyboardEvent<HTMLDivElement>) => {
    const moves: Record<string, number> = { ArrowLeft: -7, ArrowRight: 7, ArrowUp: -1, ArrowDown: 1 };
    const offset = moves[event.key];
    const index = activity.dates.get((event.target as HTMLButtonElement).dataset.date ?? "");
    if (offset === undefined || index === undefined) return;
    event.preventDefault();
    const next = activity.days[Math.max(0, Math.min(activity.days.length - 1, index + offset))];
    calendarRef.current?.querySelector<HTMLButtonElement>(`[data-date="${next.date}"]`)?.focus();
  };

  return (
    <section ref={sectionRef} id="activity" className="portfolio-section portfolio-github" aria-labelledby="activity-heading">
      <div className="portfolio-heading">
        <p className="portfolio-section-kicker" data-reveal data-reveal-side="left">04 / Open source</p>
        <div data-reveal data-reveal-side="right">
          <h2 id="activity-heading">Small commits.<br /><em>Real progress.</em></h2>
          <span>A look behind the finished work. A year of building, learning, and contributing on GitHub.</span>
        </div>
      </div>
      <div className="github-activity-panel" data-reveal data-reveal-side="left">
        <div className="github-activity-topline">
          <a className="github-activity-user" href={profile.github} target="_blank" rel="noopener noreferrer"><GithubIcon size={21} /><span>{profile.githubUsername}<small>THE BUILD LOG</small></span></a>
          <span className={`github-activity-status${hasError ? " is-unavailable" : ""}`}><i aria-hidden="true" />{hasError ? "Temporarily unavailable" : data ? "Public GitHub activity" : "Connecting to GitHub"}</span>
        </div>
        <div className="github-activity-body">
          <div className="github-activity-summary">
            <span className="github-stat-label">A year in contributions</span>
            <strong className="github-stat-total">{data ? activity.total.toLocaleString() : "—"}<span aria-hidden="true">↗</span></strong>
            <span className="github-stat-description">Contributions in the displayed year</span>
            <dl className="github-activity-stats">
              <div><dt>Active days</dt><dd>{data ? activity.activeDays : "—"}</dd></div>
              <div><dt>Longest streak</dt><dd>{data ? activity.longestStreak : "—"}<span> days</span></dd></div>
            </dl>
          </div>
          <div className="github-activity-calendar">
            <div className="github-calendar-caption"><span>Consistency, one day at a time.</span><span>LAST 12 MONTHS</span></div>
            {data ? (
              <div className="github-calendar-layout">
                <div className="github-calendar-weekdays" aria-hidden="true"><span>Mon</span><span>Wed</span><span>Fri</span></div>
                <div className="github-calendar-scroll" data-lenis-prevent-wheel>
                  <div className="github-calendar" style={calendarStyle}>
                    <div className="github-calendar-months" aria-hidden="true">
                      {activity.weeks.map((week, index) => {
                        const first = week.find((day) => day !== null);
                        const previous = activity.weeks[index - 1]?.find((day) => day !== null);
                        return <span key={index}>{first && first.date.slice(0, 7) !== previous?.date.slice(0, 7) ? monthFormat.format(new Date(`${first.date}T00:00:00Z`)) : ""}</span>;
                      })}
                    </div>
                    <div ref={calendarRef} className="github-calendar-grid" role="group" aria-label="Daily contributions. Use arrow keys to explore dates." onKeyDown={navigateCalendar}>
                      {activity.weeks.map((week, index) => (
                        <div className="github-calendar-week" key={index}>
                          {week.map((day, dayIndex) => day ? (
                            <button type="button" key={day.date} data-date={day.date} className={`github-calendar-day level-${day.level}`} tabIndex={day.date === (selectedDate ?? lastDate) ? 0 : -1} aria-label={`${day.count} contributions on ${formatDate(day.date)}`} title={`${day.count} contributions · ${formatDate(day.date)}`} onFocus={() => setSelectedDate(day.date)} onClick={() => setSelectedDate(day.date)} />
                          ) : <span key={dayIndex} className="github-calendar-day is-empty" aria-hidden="true" />)}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className={`github-calendar-placeholder${hasError ? " has-error" : ""}`} role="status">
                <span>{hasError ? "Activity could not be loaded. You can still visit the GitHub profile below." : "Loading contribution history…"}</span>
                <div className="github-calendar-skeleton" aria-hidden="true" />
              </div>
            )}
            <div className="github-calendar-bottom">
              <span className="github-calendar-detail" aria-live="polite">{selected ? `${selected.count} contributions · ${formatDate(selected.date)}` : "Each square is a day of the journey."}</span>
              <div className="github-calendar-legend" aria-label="Contribution intensity from less to more"><span>Less</span>{[0, 1, 2, 3, 4].map((level) => <i key={level} className={`level-${level}`} />)}<span>More</span></div>
            </div>
          </div>
        </div>
        <div className="github-activity-footer">
          <span>Small steps. Lasting work.<span className="github-activity-source"> · Public contribution history</span></span>
          <a href={profile.github} target="_blank" rel="noopener noreferrer">Explore GitHub <ArrowUpRight size={15} aria-hidden="true" /></a>
        </div>
      </div>
    </section>
  );
}
