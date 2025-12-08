import { useState, useMemo, useEffect } from "react";
import Layout from "@/components/layout/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar as CalendarPicker } from "@/components/ui/calendar";
import { useJobs } from "@/contexts/JobContext";
import JobDetailsModal from "@/components/jobs/JobDetailsModal";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  format,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isToday,
  isSameDay,
  addWeeks,
  subWeeks,
} from "date-fns";
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Clock,
  ArrowUpRight,
} from "lucide-react";

const TIME_SLOTS = [
  "00:00",
  "01:00",
  "02:00",
  "03:00",
  "04:00",
  "05:00",
  "06:00",
  "07:00",
  "08:00",
  "09:00",
  "10:00",
  "11:00",
  "12:00",
  "13:00",
  "14:00",
  "15:00",
  "16:00",
  "17:00",
  "18:00",
  "19:00",
  "20:00",
  "21:00",
  "22:00",
  "23:00",
];

type CalendarEvent = {
  jobId: string;
  company: string;
  position: string;
  title: string;
  description?: string;
  startTime?: string;
  endTime?: string;
  startDate: Date;
  endDate?: Date;
  color?: string;
};

const COLORS = [
  "bg-blue-100 text-blue-800",
  "bg-red-100 text-red-800",
  "bg-green-100 text-green-800",
  "bg-purple-100 text-purple-800",
  "bg-yellow-100 text-yellow-800",
  "bg-pink-100 text-pink-800",
];

const CalendarPage = () => {
  const { jobs } = useJobs();
  const [currentWeek, setCurrentWeek] = useState<Date>(new Date());
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);

  // Function to get the start and end of the current week
  const weekInterval = useMemo(() => {
    const start = startOfWeek(currentWeek, { weekStartsOn: 1 }); // Monday as start of week
    const end = endOfWeek(currentWeek, { weekStartsOn: 1 }); // Sunday as end of week
    return { start, end };
  }, [currentWeek]);

  // Get array of days for the current week
  const weekDays = useMemo(() => {
    return eachDayOfInterval({
      start: weekInterval.start,
      end: weekInterval.end,
    });
  }, [weekInterval]);

  // Map events to calendar format
  const calendarEvents = useMemo(() => {
    const events: CalendarEvent[] = [];
    const companyColors = new Map<string, string>();
    let colorIndex = 0;

    jobs.forEach((job) => {
      // Assign a color to each company
      if (!companyColors.has(job.company)) {
        companyColors.set(job.company, COLORS[colorIndex % COLORS.length]);
        colorIndex++;
      }

      const color = companyColors.get(job.company);

      // Process job events
      if (job.events && job.events.length > 0) {
        job.events.forEach((event) => {
          try {
            const startDate = new Date(event.date);
            let endDate = new Date(startDate);

            // Parse time information if available
            let startTime: string | undefined;
            let endTime: string | undefined;

            // Check if the event has time information (e.g., "2023-04-15T09:00:00")
            if (event.date.includes("T")) {
              startTime = format(startDate, "HH:mm");

              // Default to 1 hour events
              endDate = new Date(startDate.getTime() + 60 * 60 * 1000);
              endTime = format(endDate, "HH:mm");
            }

            events.push({
              jobId: job.id,
              company: job.company,
              position: job.position,
              title: event.title,
              description: event.description,
              startTime,
              endTime,
              startDate,
              endDate,
              color,
            });
          } catch (e) {
            console.error("Error parsing event date", e);
          }
        });
      }

      // Add application submission events
      if (job.appliedDate) {
        try {
          const startDate = new Date(job.appliedDate);
          let endDate = new Date(startDate);
          let startTime: string | undefined;
          let endTime: string | undefined;

          if (job.appliedDate.includes("T")) {
            startTime = format(startDate, "HH:mm");
            endDate = new Date(startDate.getTime() + 60 * 60 * 1000); // 1 hour event
            endTime = format(endDate, "HH:mm");
          }

          events.push({
            jobId: job.id,
            company: job.company,
            position: job.position,
            title: "Application Submitted",
            description: `Applied for ${job.position} at ${job.company}`,
            startTime,
            endTime,
            startDate,
            endDate,
            color,
          });
        } catch (e) {
          console.error("Error parsing application date", e);
        }
      }
    });

    return events;
  }, [jobs]);

  // Update the eventsThisWeek to sort by start time
  const eventsThisWeek = useMemo(() => {
    return calendarEvents
      .filter((event) => {
        const eventDate = event.startDate;
        return eventDate >= weekInterval.start && eventDate <= weekInterval.end;
      })
      .sort((a, b) => {
        // Sort by date, then by time if available
        if (!isSameDay(a.startDate, b.startDate)) {
          return a.startDate.getTime() - b.startDate.getTime();
        }

        if (a.startTime && b.startTime) {
          return a.startTime.localeCompare(b.startTime);
        }

        return 0;
      });
  }, [calendarEvents, weekInterval]);

  // Get events for the selected date
  const selectedDateEvents = useMemo(() => {
    return calendarEvents
      .filter((event) => isSameDay(event.startDate, selectedDate))
      .sort((a, b) => {
        // Sort by time if available
        if (a.startTime && b.startTime) {
          return a.startTime.localeCompare(b.startTime);
        }
        return 0;
      });
  }, [calendarEvents, selectedDate]);

  const goToNextWeek = () => {
    setCurrentWeek(addWeeks(currentWeek, 1));
  };

  const goToPreviousWeek = () => {
    setCurrentWeek(subWeeks(currentWeek, 1));
  };

  const goToCurrentWeek = () => {
    setCurrentWeek(new Date());
    setSelectedDate(new Date());
  };

  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      setSelectedDate(date);

      // Update current week if selected date is not in current week view
      if (date < weekInterval.start || date > weekInterval.end) {
        setCurrentWeek(date);
      }
    }
  };

  // Helper function to position an event in the grid based on its time
  const getEventPosition = (event: CalendarEvent, day: Date) => {
    // If event doesn't have a start time, return null
    if (!event.startTime) return null;

    // Check if event is on the current day
    if (
      event.startDate.getDate() !== day.getDate() ||
      event.startDate.getMonth() !== day.getMonth() ||
      event.startDate.getFullYear() !== day.getFullYear()
    ) {
      return null;
    }

    const [startHour, startMinute] = event.startTime.split(":").map(Number);
    const [endHour, endMinute] = event.endTime
      ? event.endTime.split(":").map(Number)
      : [startHour + 1, startMinute];

    // Calculate position and height based on time
    const startPosition = startHour + startMinute / 60;
    const duration = endHour - startHour + (endMinute - startMinute) / 60;

    return {
      top: `${startPosition * 3}rem`,
      height: `${Math.max(duration * 3, 4.5)}rem`, // Make taller for content
    };
  };

  // Group events by time for selected date
  const groupedEvents = useMemo(() => {
    const groups: { [time: string]: CalendarEvent[] } = {};

    selectedDateEvents.forEach((event) => {
      const timeKey = event.startTime || "No Time Specified";
      if (!groups[timeKey]) {
        groups[timeKey] = [];
      }
      groups[timeKey].push(event);
    });

    return groups;
  }, [selectedDateEvents]);

  // Add these keyboard navigation handlers in the component
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Arrow left/right to navigate weeks
      if (e.key === "ArrowLeft") {
        goToPreviousWeek();
      } else if (e.key === "ArrowRight") {
        goToNextWeek();
      }
      // Arrow up/down to navigate days
      else if (e.key === "ArrowUp") {
        const newDate = new Date(selectedDate);
        newDate.setDate(newDate.getDate() - 7);
        handleDateSelect(newDate);
      } else if (e.key === "ArrowDown") {
        const newDate = new Date(selectedDate);
        newDate.setDate(newDate.getDate() + 7);
        handleDateSelect(newDate);
      }
      // Home key for today
      else if (e.key === "Home") {
        goToCurrentWeek();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [selectedDate]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header with title and description */}
        <div className="rounded-2xl bg-gradient-to-r from-sky-500/10 via-indigo-500/10 to-purple-500/10 border border-slate-200/80 px-5 py-4 shadow-sm">
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div>
              <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">
                Calendar
              </h1>
              <p className="text-sm text-slate-600 mt-1">
                Keep interviews, submissions, and follow-ups organised in one view.
              </p>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-600 bg-white/60 border border-slate-200 px-3 py-2 rounded-xl shadow-[0_10px_30px_-15px_rgba(15,23,42,0.35)]">
              <span className="inline-flex h-2 w-2 rounded-full bg-red-500 mr-1"></span>
              Live line marks the current time today
            </div>
          </div>
        </div>

        {/* Week Navigation */}
        <Card className="border-none shadow-sm bg-white/90 backdrop-blur">
          <div className="flex justify-between items-center p-4 flex-wrap gap-3">
            <div>
              <p className="text-[11px] uppercase tracking-[0.12em] text-slate-500">
                Week of
              </p>
              <h2 className="text-lg font-semibold text-slate-900">
                {format(weekInterval.start, "MMMM d")} -{" "}
                {format(weekInterval.end, "d, yyyy")}
              </h2>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={goToPreviousWeek}
                className="h-9 px-3 rounded-full border-slate-200"
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Previous
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={goToCurrentWeek}
                className="h-9 px-3 rounded-full bg-slate-900 text-white hover:bg-slate-800"
              >
                Today
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={goToNextWeek}
                className="h-9 px-3 rounded-full border-slate-200"
              >
                Next
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </div>
        </Card>

        {/* Main content area with calendar and events */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* Left sidebar with date picker and day details */}
          <div className="md:col-span-1 space-y-6">
            {/* Date Picker Card */}
            <Card className="border border-slate-200 shadow-sm rounded-2xl bg-white/90">
              <CardHeader className="pb-3 pt-4">
                <CardTitle className="text-md font-medium">
                  Select Date
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <CalendarPicker
                  mode="single"
                  selected={selectedDate}
                  onSelect={handleDateSelect}
                  modifiers={{
                    highlighted: (day) => {
                      return calendarEvents.some((event) =>
                        isSameDay(event.startDate, day)
                      );
                    },
                  }}
                  modifiersClassNames={{
                    highlighted: "bg-blue-50",
                    selected: "bg-blue-600 text-white font-medium",
                    today: "text-blue-900 font-medium border border-blue-300",
                  }}
                  classNames={{
                    day: "h-8 w-8 p-0 font-normal text-xs rounded-md",
                    day_selected:
                      "bg-blue-600 text-white font-medium hover:bg-blue-600 hover:text-white rounded-md",
                    day_today: "text-blue-900 font-medium rounded-md",
                    cell: "text-center p-0 relative focus-within:relative focus-within:z-20",
                    head_cell: "text-muted-foreground w-8 font-normal text-xs",
                    table: "w-full border-collapse",
                    caption:
                      "flex justify-center pt-1 relative items-center mb-1",
                    caption_label: "text-sm font-medium",
                    nav: "space-x-1 flex items-center",
                    nav_button:
                      "h-6 w-6 bg-transparent p-0 hover:bg-gray-100 rounded-full",
                    nav_button_previous: "absolute left-1",
                    nav_button_next: "absolute right-1",
                    month: "space-y-2",
                  }}
                  showOutsideDays={true}
                />
              </CardContent>
            </Card>

            {/* Selected Date Events Card */}
            <Card className="border border-slate-200 shadow-sm rounded-2xl bg-white/90">
              <CardHeader className="pb-3 pt-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-md font-semibold flex items-center text-slate-900">
                    <CalendarIcon className="h-4 w-4 mr-2 text-slate-600" />
                    {format(selectedDate, "EEEE, MMMM d")}
                    {isToday(selectedDate) && (
                      <Badge className="ml-2 px-1.5 py-0 h-5 text-[10px] bg-slate-900 text-white">
                        Today
                      </Badge>
                    )}
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent className="p-0 max-h-[420px] overflow-y-auto">
                {selectedDateEvents.length > 0 ? (
                  <div className="px-4 pb-4 space-y-3">
                    {Object.entries(groupedEvents).map(([time, events]) => (
                      <div key={time} className="rounded-xl border border-slate-100 bg-slate-50/60 p-3">
                        <div className="flex items-center mb-2">
                          <Clock className="h-3.5 w-3.5 text-slate-600 mr-2" />
                          <div className="text-xs font-semibold text-slate-800">
                            {time}
                          </div>
                        </div>
                        <div className="space-y-2">
                          {events.map((event, index) => (
                            <div
                              key={`${event.jobId}-${index}`}
                              className={`${event.color} border border-slate-200/60 rounded-lg p-3 shadow-[0_10px_30px_-20px_rgba(15,23,42,0.5)] transition-all hover:shadow-lg hover:-translate-y-0.5 cursor-pointer`}
                              onClick={() => setSelectedJobId(event.jobId)}
                            >
                              <div className="font-semibold text-sm">
                                {event.title}
                              </div>
                              <div className="text-xs mt-1 flex items-center text-slate-800">
                                <span className="font-medium">
                                  {event.company}
                                </span>
                                {event.position && (
                                  <span className="ml-1 text-slate-700">
                                    • {event.position}
                                  </span>
                                )}
                              </div>
                              {event.description && (
                                <div className="mt-2 text-xs text-slate-700">
                                  {event.description}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 text-slate-400 px-4">
                    <CalendarIcon className="h-8 w-8 mb-2 opacity-30" />
                    <p className="text-sm text-center">
                      No events scheduled for this day
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Week View - Takes most of the space */}
          <div className="md:col-span-3">
            <Card className="border border-slate-200 shadow-lg/30 overflow-hidden rounded-2xl bg-white">
              {/* Header row with day names */}
              <div className="grid grid-cols-8 border-b border-slate-200 bg-slate-50/80 backdrop-blur-sm">
                <div className="col-span-1 py-3 px-3 border-r bg-white flex flex-col gap-0.5">
                  <span className="text-[11px] uppercase tracking-[0.12em] text-slate-500 font-semibold">
                    Week start
                  </span>
                  <span className="text-sm font-semibold text-slate-900 leading-none">
                    {format(weekInterval.start, "MMM d")}
                  </span>
                </div>
                {weekDays.map((day, dayIndex) => (
                  <div
                    key={dayIndex}
                    className={`col-span-1 py-3 cursor-pointer flex flex-col items-center justify-center border-l first:border-l-0 border-slate-100 transition-all duration-150
                      ${isToday(day) ? "bg-indigo-50 text-indigo-900" : "bg-white"}
                      ${
                        isSameDay(day, selectedDate)
                          ? "bg-indigo-100 ring-1 ring-indigo-200 shadow-inner"
                          : ""
                      } hover:bg-slate-50`}
                    onClick={() => handleDateSelect(day)}
                  >
                    <div className="text-[11px] text-slate-600 font-semibold mb-1">
                      {format(day, "EEE")}
                    </div>
                    <div
                      className={`font-semibold rounded-full h-9 w-9 flex items-center justify-center text-slate-800 shadow-sm border border-transparent
                        ${isToday(day) ? "bg-indigo-600 text-white shadow-md border-indigo-500/30" : ""}
                        ${
                          isSameDay(day, selectedDate) && !isToday(day)
                            ? "bg-white border border-indigo-200"
                            : ""
                        }`}
                    >
                      {format(day, "d")}
                    </div>
                  </div>
                ))}
              </div>

              {/* Time grid */}
              <div className="grid grid-cols-8 h-[calc(100vh-200px)] overflow-y-auto bg-white pb-20">
                {/* Time slots column */}
                <div className="col-span-1 sticky left-0 bg-white z-20 border-r border-slate-200 shadow-[6px_0_18px_-18px_rgba(15,23,42,0.35)]">
                  {TIME_SLOTS.map((time, i) => (
                    <div
                      key={i}
                      className={`h-12 text-[11px] text-slate-600 pr-3 text-right border-b border-slate-200/80 flex items-center justify-end font-semibold
                        ${i % 2 === 0 ? "bg-slate-50/70" : "bg-white"}`}
                    >
                      {time}
                    </div>
                  ))}
                  {/* Add 00:00 time slot at the bottom explicitly */}
                  <div className="h-12 text-[11px] text-slate-600 pr-3 text-right border-b border-slate-200/80 flex items-center justify-end font-semibold bg-slate-50/70">
                    00:00
                  </div>
                </div>

                {/* Days of the week content cells */}
                {weekDays.map((day, dayIndex) => (
                  <div
                    key={dayIndex}
                    className={`col-span-1 relative bg-white
                      ${dayIndex < weekDays.length - 1 ? "border-r border-slate-100" : ""}
                      ${isSameDay(day, selectedDate) ? "bg-indigo-50/50 ring-1 ring-indigo-100/70" : ""}
                      ${isToday(day) ? "bg-indigo-50/40" : ""}`}
                    onClick={() => handleDateSelect(day)}
                  >
                    {/* Time cells */}
                    <div className="relative">
                      {TIME_SLOTS.map((_, i) => (
                        <div
                          key={i}
                          className={`h-12 border-b border-slate-200/70 ${
                            i % 2 === 0 ? "bg-slate-50/50" : "bg-white"
                          }`}
                        />
                      ))}
                      {/* Add extra cell for 00:00 */}
                      <div className="h-12 border-b border-slate-200/70 bg-slate-50/50"></div>

                      {/* Current time indicator */}
                      {isToday(day) && (
                        <div
                          className="absolute left-2 right-2 border-t-2 border-rose-500/90 z-20"
                          style={{
                            top: `${
                              (new Date().getHours() +
                                new Date().getMinutes() / 60) *
                              3
                            }rem`,
                          }}
                        >
                          <div className="absolute -left-2 -top-1.5 w-2.5 h-2.5 rounded-full bg-rose-500 shadow-[0_0_0_3px_rgba(255,255,255,0.85)]"></div>
                        </div>
                      )}

                      {/* Events for this day - sorted by start time */}
                      {eventsThisWeek
                        .filter((event) => isSameDay(event.startDate, day))
                        .map((event, eventIndex) => {
                          const position = getEventPosition(event, day);
                          if (!position) return null;

                          // Offset the top position slightly for sequential events with the same start time
                          const sameTimeEvents = eventsThisWeek.filter(
                            (e) =>
                              isSameDay(e.startDate, day) &&
                              e.startTime === event.startTime &&
                              eventsThisWeek.indexOf(e) <
                                eventsThisWeek.indexOf(event)
                          );

                          // Add a small offset to position events that start at the same time
                          const topOffset =
                            sameTimeEvents.length > 0
                              ? sameTimeEvents.length * 0.5
                              : 0;

                          return (
                            <div
                              key={eventIndex}
                              className={`absolute left-2 right-2 ${event.color} z-10 overflow-visible rounded-xl border border-slate-200/70 shadow-[0_18px_38px_-28px_rgba(15,23,42,0.65)] backdrop-blur-[1px]`}
                              style={{
                                top: `calc(${position.top} + ${topOffset}rem)`,
                                height: position.height,
                                opacity: 0.97, // Slightly transparent to help with overlap
                              }}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDateSelect(event.startDate);
                                setSelectedJobId(event.jobId);
                              }}
                            >
                              <div className="px-3 py-2 h-full flex flex-col justify-between">
                                <div className="space-y-1">
                                  <div className="font-semibold text-xs leading-tight text-slate-900">
                                    {event.title}
                                  </div>

                                  {event.startTime && event.endTime && (
                                    <div className="text-[11px] text-slate-800 flex items-center gap-1">
                                      <Clock className="h-3 w-3 inline-block flex-shrink-0" />
                                      <span>
                                        {event.startTime} - {event.endTime}
                                      </span>
                                    </div>
                                  )}
                                </div>

                                <div className="text-[11px] text-slate-800 font-semibold mt-1">
                                  {event.company}
                                </div>

                                {/* Accent on right edge */}
                                <div className="absolute right-0 top-0 bottom-0 w-1.5 bg-slate-900/50 rounded-r-xl"></div>
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>
      </div>

      {/* Job details modal for quick drill-in from calendar */}
      {selectedJobId && (
        <JobDetailsModal
          isOpen={true}
          onClose={() => setSelectedJobId(null)}
          jobId={selectedJobId}
        />
      )}
    </Layout>
  );
};

export default CalendarPage;
