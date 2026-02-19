import { StravaActivity } from './strava';
import { calculateStreaks } from './streaks';

function formatDistance(m: number): string {
  const km = m / 1000;
  return km >= 1 ? `${km.toFixed(2)} km` : `${m} m`;
}

function formatDuration(sec: number): string {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

function formatPace(minPerKm: number): string {
  const min = Math.floor(minPerKm);
  const sec = Math.round((minPerKm - min) * 60);
  return `${min}:${sec.toString().padStart(2, '0')}/km`;
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function addFollowUp(response: string, suggestions: string[]): string {
  if (suggestions.length === 0) return response;
  const hint = pick([
    'You might also ask:',
    'Try asking:',
    'Want to dig deeper?',
  ]);
  return `${response}\n\n_${hint} ${pick(suggestions)}_`;
}

function formatDate(s: string): string {
  return new Date(s).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function getDateRange(query: string): { start: Date; end: Date } | null {
  const now = new Date();
  const q = query.toLowerCase();

  if (/\b(last|past)\s*(7|seven)\s*days?\b|\blast\s*week\b/.test(q)) {
    const end = new Date(now);
    const start = new Date(now);
    start.setDate(start.getDate() - 7);
    return { start, end };
  }
  if (/\bthis\s*month\b/.test(q)) {
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const end = new Date(now);
    return { start, end };
  }
  if (/\b(last|past)\s*(30|thirty)\s*days?\b|\blast\s*month\b/.test(q)) {
    const end = new Date(now);
    const start = new Date(now);
    start.setDate(start.getDate() - 30);
    return { start, end };
  }
  if (/\bthis\s*year\b|\byear\s*to\s*date\b|ytd\b/.test(q)) {
    const start = new Date(now.getFullYear(), 0, 1);
    const end = new Date(now);
    return { start, end };
  }
  if (/\btoday\b/.test(q)) {
    const start = new Date(now);
    start.setHours(0, 0, 0, 0);
    return { start, end: now };
  }
  if (/\byesterday\b/.test(q)) {
    const start = new Date(now);
    start.setDate(start.getDate() - 1);
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setHours(23, 59, 59, 999);
    return { start, end };
  }
  if (/\b(last|past)\s*(3|4|5|6)\s*days?\b/.test(q)) {
    const m = q.match(/\b(last|past)\s*(3|4|5|6)\s*days?\b/);
    const n = m ? parseInt(m[2], 10) : 7;
    const end = new Date(now);
    const start = new Date(now);
    start.setDate(start.getDate() - n);
    return { start, end };
  }
  return null;
}

const ACTIVITY_TYPES: Record<string, string[]> = {
  Run: ['run', 'runs', 'running', 'jog'],
  Ride: ['ride', 'rides', 'cycling', 'bike', 'biking'],
  Swim: ['swim', 'swims', 'swimming'],
  Walk: ['walk', 'walks', 'walking'],
  Hike: ['hike', 'hikes', 'hiking'],
  Workout: ['workout', 'workouts'],
};

function getActivityType(query: string): string | null {
  const q = query.toLowerCase();
  for (const [type, keywords] of Object.entries(ACTIVITY_TYPES)) {
    if (keywords.some((k) => q.includes(k))) return type;
  }
  return null;
}

function getActivityTypes(query: string): string[] {
  const q = query.toLowerCase();
  const found: string[] = [];
  for (const [type, keywords] of Object.entries(ACTIVITY_TYPES)) {
    if (keywords.some((k) => q.includes(k)) && !found.includes(type)) found.push(type);
  }
  return found;
}

function filterActivities(
  activities: StravaActivity[],
  query: string
): StravaActivity[] {
  let filtered = [...activities];
  const q = query.toLowerCase();

  const typeFilter = getActivityType(query);
  const typesFilter = getActivityTypes(query);
  if (typesFilter.length > 1) {
    filtered = filtered.filter((a) => typesFilter.includes(a.type));
  } else if (typeFilter) {
    filtered = filtered.filter((a) => a.type === typeFilter);
  }

  const dateRange = getDateRange(query);
  if (dateRange) {
    const isThisMonth = /\bthis\s*month\b/.test(q);
    filtered = filtered.filter((a) => {
      const d = new Date(a.start_date_local);
      if (isNaN(d.getTime())) return false;
      if (isThisMonth) {
        const now = new Date();
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
      }
      return d >= dateRange!.start && d <= dateRange!.end;
    });
  }

  // Only apply name search when explicitly searching by activity name (e.g. "find morning run")
  // Skip when filtering by type or date - "show runs from last week" is a filter, not a name search
  const isQuestion = /\bhow\s*many\b|\bcount\b|\bnumber\s*of\b|\btotal\b|\bhow\s*far\b|\blongest\b|\bshortest\b|\bactivities\s*\??\s*$/.test(q);
  const hasTypeOrDateFilter = !!typeFilter || !!dateRange;
  if (!isQuestion && !hasTypeOrDateFilter) {
    const searchTerms = query
      .split(/\s+/)
      .filter((w) => w.length > 2 && !/^(run|runs|ride|rides|swim|walk|hike|last|this|the|and|for|my|me|get|show|find|list|from|week|month|year|days)$/i.test(w));
    if (searchTerms.length > 0) {
      filtered = filtered.filter((a) =>
        searchTerms.some((term) => a.name.toLowerCase().includes(term.toLowerCase()))
      );
    }
  }

  return filtered;
}

export function processChatQuery(
  userMessage: string,
  activities: StravaActivity[]
): string {
  const q = userMessage.trim().toLowerCase();

  if (!q || q === 'hi' || q === 'hello' || q === 'hey') {
    const greeting = pick([
      "Hey! Ready to explore your activities?",
      "Hi there! What would you like to know about your training?",
      "Hello! I'm here to help you dig into your Strava data.",
    ]);
    return `${greeting}

Try asking:
• "Show my runs from last week"
• "What was my longest ride?"
• "How many activities this month?"
• "Give me a summary" or "What's my streak?"
• "Total distance for rides this year"`;
  }

  if (/\bhelp\b|\bwhat can you do\b|\bcapabilities\b/.test(q)) {
    return `Here's what I can do:

**Search & filter** – By type (runs, rides), date (last week, yesterday, last 5 days), or name
**Stats** – Total distance, longest/shortest, average pace, elevation, fastest run
**Compare** – "runs vs rides this month", "this month vs last month"
**Trends** – "Am I improving?", "How's my progress?"
**Breakdown** – "Breakdown by type", "Activity distribution"
**Top N** – "Top 5 runs", "Best 3 rides this month"

Just ask naturally – e.g. "compare runs vs rides", "top 5 longest runs", "am I improving?"`;
  }

  // Summary / overview
  if (/\bsummary\b|\boverview\b|\bhow\s*am\s*i\s*doing\b|\bquick\s*stats\b/.test(q)) {
    const filtered = filterActivities(activities, userMessage);
    const streaks = calculateStreaks(filtered.length > 0 ? filtered : activities);
    const totalDist = activities.reduce((s, a) => s + a.distance, 0);
    const runs = activities.filter((a) => a.type === 'Run');
    const rides = activities.filter((a) => a.type === 'Ride');
    const runDist = runs.reduce((s, a) => s + a.distance, 0);
    const rideDist = rides.reduce((s, a) => s + a.distance, 0);

    let summary = `**Your activity at a glance:**\n\n`;
    summary += `• **${activities.length}** total activities in your history\n`;
    summary += `• **${formatDistance(totalDist)}** total distance\n`;
    if (runs.length > 0) summary += `• **${runs.length}** runs (${formatDistance(runDist)})\n`;
    if (rides.length > 0) summary += `• **${rides.length}** rides (${formatDistance(rideDist)})\n`;
    if (streaks.current > 0 || streaks.longest > 0) {
      summary += `• **Current streak:** ${streaks.current} days | **Longest:** ${streaks.longest} days\n`;
    }
    const lastActivity = activities[0];
    if (lastActivity) {
      summary += `• **Last activity:** [${lastActivity.name}](/activities/${lastActivity.id}) – ${formatDate(lastActivity.start_date_local)}\n`;
    }
    return addFollowUp(summary, ['How many runs this month?', 'What was my longest ride?', 'Show activities from last week']);
  }

  // Streak query
  if (/\bstreak\b|\bconsecutive\b|\bconsistency\b/.test(q)) {
    const filtered = filterActivities(activities, userMessage);
    const streaks = calculateStreaks(filtered.length > 0 ? filtered : activities);
    if (streaks.current === 0 && streaks.longest === 0) {
      return `No streaks yet – get out there! Your first activity will start your streak. 💪

_Try: "Show my runs from last week" to see recent activities._`;
    }
    let msg = `**Your streak stats:**\n\n`;
    msg += `• **Current streak:** ${streaks.current} day${streaks.current !== 1 ? 's' : ''}\n`;
    msg += `• **Longest streak:** ${streaks.longest} day${streaks.longest !== 1 ? 's' : ''}\n`;
    if (streaks.longestStartDate && streaks.longestEndDate) {
      msg += `• Best run: ${formatDate(streaks.longestStartDate)} → ${formatDate(streaks.longestEndDate)}\n`;
    }
    return addFollowUp(msg, ['Give me a summary', 'How many activities this month?']);
  }

  // Average pace (for runs)
  if (/\baverage\s*pace\b|\bpace\b|\bavg\s*pace\b|\btypical\s*pace\b/.test(q)) {
    const runs = filterActivities(activities, userMessage).filter((a) => a.type === 'Run' && a.distance > 0 && a.average_speed > 0);
    if (runs.length === 0) {
      return `I don't have enough run data to calculate pace for that period. Try "runs from last month" or "all my runs".`;
    }
    const totalDist = runs.reduce((s, a) => s + a.distance, 0);
    const totalTime = runs.reduce((s, a) => s + a.moving_time, 0);
    const avgPaceMinPerKm = (totalTime / 60) / (totalDist / 1000);
    const avgSpeed = runs.reduce((s, a) => s + a.average_speed, 0) / runs.length;
    return `**Average run pace** (${runs.length} runs):

• **Pace:** ${formatPace(avgPaceMinPerKm)}
• **Speed:** ${(avgSpeed * 3.6).toFixed(2)} km/h
• Based on **${formatDistance(totalDist)}** over **${formatDuration(totalTime)}**

_Try: "What was my longest run?" or "Total distance this month"_`;
  }

  // Most elevation
  if (/\bmost\s*elevation\b|\bhighest\s*climb\b|\bbest\s*elevation\b|\bmost\s*climbing\b/.test(q)) {
    const filtered = filterActivities(activities, userMessage);
    const withElev = filtered.filter((a) => a.total_elevation_gain > 0);
    if (withElev.length === 0) {
      return `No activities with elevation data for that filter. Try "all activities" or a different date range.`;
    }
    const best = withElev.reduce((a, b) => (a.total_elevation_gain > b.total_elevation_gain ? a : b));
    return `**Most elevation gain:** [${best.name}](/activities/${best.id})
• **Elevation:** ${Math.round(best.total_elevation_gain)} m
• **Distance:** ${formatDistance(best.distance)}
• **Date:** ${formatDate(best.start_date_local)}

_Try: "Longest ride" or "Total distance this year"_`;
  }

  // Compare (runs vs rides, this month vs last)
  if (/\bcompare\b|\bvs\b|\bversus\b|\bvs\.\b/.test(q)) {
    const filtered = filterActivities(activities, userMessage);
    const types = getActivityTypes(userMessage);
    const hasTwoTypes = types.length >= 2;
    const hasMonthCompare = /\bthis\s*month\b|\blast\s*month\b/.test(q);

    if (hasTwoTypes) {
      const rows = types.map((t) => {
        const list = filtered.filter((a) => a.type === t);
        const dist = list.reduce((s, a) => s + a.distance, 0);
        return { type: t, count: list.length, distance: dist };
      });
      let msg = `**Comparison:**\n\n`;
      rows.forEach((r) => {
        msg += `• **${r.type}s:** ${r.count} activities, ${formatDistance(r.distance)}\n`;
      });
      const winner = rows.reduce((a, b) => (a.distance > b.distance ? a : b));
      msg += `\n_${winner.type}s lead by distance._`;
      return addFollowUp(msg, ['Total distance?', 'Which was longest?']);
    }

    if (hasMonthCompare) {
      const now = new Date();
      const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
      const thisMonth = activities.filter((a) => {
        const d = new Date(a.start_date_local);
        return d >= thisMonthStart && d <= now;
      });
      const lastMonth = activities.filter((a) => {
        const d = new Date(a.start_date_local);
        return d >= lastMonthStart && d <= lastMonthEnd;
      });
      const thisDist = thisMonth.reduce((s, a) => s + a.distance, 0);
      const lastDist = lastMonth.reduce((s, a) => s + a.distance, 0);
      const diff = thisDist - lastDist;
      const pct = lastDist > 0 ? ((diff / lastDist) * 100).toFixed(0) : '∞';
      let msg = `**This month vs last month:**\n\n`;
      msg += `• **This month:** ${thisMonth.length} activities, ${formatDistance(thisDist)}\n`;
      msg += `• **Last month:** ${lastMonth.length} activities, ${formatDistance(lastDist)}\n`;
      msg += `• **Change:** ${diff >= 0 ? '+' : ''}${formatDistance(diff)} (${diff >= 0 ? '+' : ''}${pct}%)\n`;
      return addFollowUp(msg, ['Give me a summary', 'How many runs?']);
    }

    return `I can compare runs vs rides, or this month vs last month. Try: "compare runs vs rides this month" or "this month vs last month".`;
  }

  // Trend / improvement
  if (/\bimproving\b|\bimprovement\b|\bprogress\b|\btrend\b|\bmore\s*active\b|\bless\s*active\b|\bbetter\b|\bworse\b/.test(q)) {
    const now = new Date();
    const thisMonth = activities.filter((a) => {
      const d = new Date(a.start_date_local);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    });
    const lastMonth = activities.filter((a) => {
      const d = new Date(a.start_date_local);
      const lastMonthNum = now.getMonth() === 0 ? 11 : now.getMonth() - 1;
      const lastYear = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear();
      return d.getMonth() === lastMonthNum && d.getFullYear() === lastYear;
    });
    const thisDist = thisMonth.reduce((s, a) => s + a.distance, 0);
    const lastDist = lastMonth.reduce((s, a) => s + a.distance, 0);
    const diff = thisDist - lastDist;
    const pct = lastDist > 0 ? ((diff / lastDist) * 100).toFixed(0) : '0';
    let msg = `**Your progress:**\n\n`;
    msg += `• **This month:** ${thisMonth.length} activities, ${formatDistance(thisDist)}\n`;
    msg += `• **Last month:** ${lastMonth.length} activities, ${formatDistance(lastDist)}\n`;
    if (diff > 0) msg += `• You're **${pct}%** more active this month – keep it up! 📈\n`;
    else if (diff < 0) msg += `• Down **${Math.abs(parseInt(pct, 10))}%** from last month – time to get back out there.\n`;
    else msg += `• About the same as last month.\n`;
    return addFollowUp(msg, ['Compare runs vs rides', 'What\'s my streak?']);
  }

  // Breakdown by type
  if (/\bbreakdown\b|\bby\s*type\b|\bsplit\b|\bdistribution\b/.test(q)) {
    const filtered = filterActivities(activities, userMessage);
    const byType = new Map<string, { count: number; distance: number }>();
    filtered.forEach((a) => {
      const cur = byType.get(a.type) || { count: 0, distance: 0 };
      byType.set(a.type, { count: cur.count + 1, distance: cur.distance + a.distance });
    });
    const sorted = Array.from(byType.entries()).sort((a, b) => b[1].count - a[1].count);
    if (sorted.length === 0) return `No activities to break down. Try a broader filter.`;
    let msg = `**Activity breakdown:**\n\n`;
    sorted.forEach(([type, { count, distance }]) => {
      const pct = filtered.length > 0 ? ((count / filtered.length) * 100).toFixed(0) : '0';
      msg += `• **${type}:** ${count} (${pct}%), ${formatDistance(distance)}\n`;
    });
    return addFollowUp(msg, ['Compare runs vs rides', 'Total distance?']);
  }

  // Top N
  if (/\btop\s*\d+\b|\bbest\s*\d+\b|\bfirst\s*\d+\b/.test(q)) {
    const m = q.match(/\b(?:top|best|first)\s*(\d+)\b/);
    const n = m ? Math.min(parseInt(m[1], 10), 10) : 5;
    const filtered = filterActivities(activities, userMessage);
    const byType = getActivityType(userMessage);
    let list = filtered;
    if (byType) list = list.filter((a) => a.type === byType);
    const longest = [...list].sort((a, b) => b.distance - a.distance).slice(0, n);
    if (longest.length === 0) return `No activities found. Try "top 5 runs" or "best 3 rides this month".`;
    const typeLabel = byType ? ` ${byType}s` : ' activities';
    const lines = longest.map((a) => `• [${a.name}](/activities/${a.id}) – ${formatDistance(a.distance)}, ${formatDate(a.start_date_local)}`);
    return `**Top ${n} longest${typeLabel}:**\n\n${lines.join('\n')}\n\n_Try: "Total distance for these?" or "What was my average pace?"_`;
  }

  // Fastest
  if (/\bfastest\b|\bquickest\b|\bbest\s*pace\b|\bpb\b|\bpersonal\s*best\b/.test(q)) {
    const runs = filterActivities(activities, userMessage).filter((a) => a.type === 'Run' && a.distance > 0 && a.average_speed > 0);
    if (runs.length === 0) return `No run data for that period. Try "fastest run" or "fastest runs last month".`;
    const fastest = runs.reduce((a, b) => (a.average_speed > b.average_speed ? a : b));
    const paceMinPerKm = (fastest.moving_time / 60) / (fastest.distance / 1000);
    const msg = `**Fastest run:** [${fastest.name}](/activities/${fastest.id})
• **Pace:** ${formatPace(paceMinPerKm)}
• **Distance:** ${formatDistance(fastest.distance)}
• **Date:** ${formatDate(fastest.start_date_local)}`;
    return addFollowUp(msg, ['Average pace?', 'Longest run?']);
  }

  // Clarification when very ambiguous
  if (q.split(/\s+/).length <= 2 && !/\b(run|ride|swim|walk|hike|help|hi|hey)\b/.test(q)) {
    const short = q.length < 10;
    if (short) {
      return `I'm not sure what you're looking for. You could try:
• "Give me a summary" – quick overview
• "Show my runs" – list activities
• "How many activities?" – count
• "Help" – see what I can do`;
    }
  }

  // Recent / latest
  if (/\brecent\b|\blast\b|\blatest\b|\bnewest\b/.test(q) && !/\blast\s*(week|month|7|30)\b/.test(q)) {
    const filtered = filterActivities(activities, userMessage);
    const recent = (filtered.length > 0 ? filtered : activities).slice(0, 5);
    if (recent.length === 0) return `No activities found. Try syncing your Strava data.`;
    const lines = recent.map((a) => `• [${a.name}](/activities/${a.id}) – ${formatDistance(a.distance)}, ${formatDate(a.start_date_local)}`);
    return `**Your ${recent.length} most recent activities:**\n\n${lines.join('\n')}\n\n_Try: "Show runs from last week" or "Give me a summary"_`;
  }

  const filtered = filterActivities(activities, userMessage);

  if (/\blongest\b|\bfurthest\b|\bmost\s*distance\b/.test(q)) {
    const byType = getActivityType(userMessage);
    let candidates = filtered;
    if (byType) candidates = candidates.filter((a) => a.type === byType);
    if (candidates.length === 0) {
      return `No activities found for that filter. Try "longest ride" or "longest run" without a date, or broaden the date range.`;
    }
    const longest = candidates.reduce((a, b) => (a.distance > b.distance ? a : b));
    const msg = `**Your longest ${longest.type.toLowerCase()}:** [${longest.name}](/activities/${longest.id})
• **Distance:** ${formatDistance(longest.distance)}
• **Duration:** ${formatDuration(longest.moving_time)}
• **Date:** ${formatDate(longest.start_date_local)}`;
    return addFollowUp(msg, ['Total distance this month?', 'What about my average pace?', 'Show my recent activities']);
  }

  if (/\bshortest\b|\bleast\s*distance\b/.test(q)) {
    const byType = getActivityType(userMessage);
    let candidates = filtered.filter((a) => a.distance > 0);
    if (byType) candidates = candidates.filter((a) => a.type === byType);
    if (candidates.length === 0) {
      return `No activities found. Try a broader filter like "runs" or "last month".`;
    }
    const shortest = candidates.reduce((a, b) => (a.distance < b.distance ? a : b));
    const msg = `**Shortest activity:** [${shortest.name}](/activities/${shortest.id})
• **Distance:** ${formatDistance(shortest.distance)}
• **Duration:** ${formatDuration(shortest.moving_time)}
• **Date:** ${formatDate(shortest.start_date_local)}`;
    return addFollowUp(msg, ['What was my longest run?', 'How many activities this month?']);
  }

  if (/\btotal\s*distance\b|\bhow\s*far\b|\bsum\s*distance\b|\bdistance\s*total\b/.test(q)) {
    const total = filtered.reduce((s, a) => s + a.distance, 0);
    const typeFilter = getActivityType(userMessage);
    const typeLabel = typeFilter ? ` (${typeFilter}s)` : '';
    const msg = `**Total distance${typeLabel}:** ${formatDistance(total)}
Across **${filtered.length}** activities.`;
    return addFollowUp(msg, ['How many activities?', 'What was my longest?', 'Give me a summary']);
  }

  if (/\bhow\s*many\b|\bcount\b|\bnumber\s*of\b|\bactivities\b.*\b\?/.test(q)) {
    const typeFilter = getActivityType(userMessage);
    const typeLabel = typeFilter ? ` ${typeFilter}` : '';
    const msg = `You have **${filtered.length}**${typeLabel} activities matching your query.`;
    return addFollowUp(msg, ['Total distance?', 'Show me the list', 'What about my streak?']);
  }

  if (/\bshow\b|\bfind\b|\bsearch\b|\blist\b|\bmy\s*(runs|rides|activities)\b|\bget\b/.test(q) || (filtered.length > 0 && filtered.length <= 50)) {
    if (filtered.length === 0) {
      return `No activities found for that search. Try:
• Broader date: "runs" or "last month" instead of "last week"
• Different type: "rides" or "all activities"
• Or ask "Give me a summary" to see what data we have`;
    }
    const display = filtered.slice(0, 10);
    const lines = display.map(
      (a) =>
        `• [${a.name}](/activities/${a.id}) – ${formatDistance(a.distance)}, ${formatDuration(a.moving_time)} (${formatDate(a.start_date_local)})`
    );
    const more = filtered.length > 10 ? `\n_...and ${filtered.length - 10} more_` : '';
    const msg = `Found **${filtered.length}** activities:\n\n${lines.join('\n')}${more}`;
    return addFollowUp(msg, ['Total distance for these?', 'What was the longest?', 'How many more this month?']);
  }

  if (filtered.length > 0) {
    return `I found **${filtered.length}** activities. You could ask:
• "Show my runs from last week"
• "What was my longest ride?"
• "Total distance this month" or "Give me a summary"`;
  }

  return `I can search by type (runs, rides), date (last week, this month), or ask for stats. Try: "runs last week", "longest ride", "give me a summary", or "how's my streak?"`;
}
