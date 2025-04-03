import { useState, useMemo, useEffect } from "react";
import Layout from "@/components/layout/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar as CalendarPicker } from "@/components/ui/calendar";
import { useJobs } from "@/contexts/JobContext";
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
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Calendar</h1>
          <p className="text-sm text-gray-500 mt-1">
            Track your upcoming interviews and application deadlines
          </p>
        </div>

        {/* Week Navigation */}
        <Card className="border-none shadow-sm bg-white">
          <div className="flex justify-between items-center p-4">
            <h2 className="text-lg font-medium">
              {format(weekInterval.start, "MMMM d")} -{" "}
              {format(weekInterval.end, "d, yyyy")}
            </h2>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={goToPreviousWeek}
                className="h-8 px-3 rounded-md"
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={goToCurrentWeek}
                className="h-8 px-3 rounded-md"
              >
                Today
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={goToNextWeek}
                className="h-8 px-3 rounded-md"
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
            <Card className="border-none shadow-sm">
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
            <Card className="border-none shadow-sm">
              <CardHeader className="pb-3 pt-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-md font-medium flex items-center">
                    <CalendarIcon className="h-4 w-4 mr-2" />
                    {format(selectedDate, "EEEE, MMMM d")}
                    {isToday(selectedDate) && (
                      <Badge className="ml-2 px-1.5 py-0 h-5 text-[10px]">
                        Today
                      </Badge>
                    )}
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent className="p-0 max-h-[400px] overflow-y-auto">
                {selectedDateEvents.length > 0 ? (
                  <div className="px-4 pb-4">
                    {Object.entries(groupedEvents).map(([time, events]) => (
                      <div key={time} className="mb-3">
                        <div className="flex items-center mb-2">
                          <Clock className="h-3 w-3 text-blue-600 mr-2" />
                          <div className="text-xs font-medium text-blue-600">
                            {time}
                          </div>
                        </div>
                        <div className="space-y-2">
                          {events.map((event, index) => (
                            <div
                              key={`${event.jobId}-${index}`}
                              className={`${event.color} border rounded-md p-3 shadow-sm transition-all hover:shadow-md`}
                            >
                              <div className="font-medium text-sm">
                                {event.title}
                              </div>
                              <div className="text-xs mt-1 flex items-center">
                                <span className="font-medium">
                                  {event.company}
                                </span>
                                {event.position && (
                                  <span className="ml-1">
                                    • {event.position}
                                  </span>
                                )}
                              </div>
                              {event.description && (
                                <div className="mt-2 text-xs">
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
                  <div className="flex flex-col items-center justify-center py-12 text-gray-400 px-4">
                    <CalendarIcon className="h-8 w-8 mb-2 opacity-20" />
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
            <Card className="border-none shadow-sm overflow-hidden">
              {/* Header row with day names */}
              <div className="grid grid-cols-8 border-b">
                <div className="col-span-1 py-2 px-3 bg-gray-50 border-r">
                  {/* Empty corner cell */}
                </div>
                {weekDays.map((day, dayIndex) => (
                  <div
                    key={dayIndex}
                    className={`col-span-1 py-2 cursor-pointer flex flex-col items-center justify-center
                      ${isToday(day) ? "bg-blue-50" : "bg-gray-50"}
                      ${isSameDay(day, selectedDate) ? "bg-blue-100" : ""}`}
                    onClick={() => handleDateSelect(day)}
                  >
                    <div className="text-xs text-gray-500 mb-1">
                      {format(day, "EEE")}
                    </div>
                    <div
                      className={`font-medium rounded-full h-7 w-7 flex items-center justify-center
                        ${isToday(day) ? "bg-blue-600 text-white" : ""}
                        ${
                          isSameDay(day, selectedDate) && !isToday(day)
                            ? "bg-blue-100"
                            : ""
                        }`}
                    >
                      {format(day, "d")}
                    </div>
                  </div>
                ))}
              </div>

              {/* Time grid */}
              <div className="grid grid-cols-8 h-[calc(100vh-180px)] overflow-y-auto bg-white pb-20">
                {/* Time slots column */}
                <div className="col-span-1 sticky left-0 bg-gray-50 z-10 border-r">
                  {TIME_SLOTS.map((time, i) => (
                    <div
                      key={i}
                      className="h-12 text-xs text-gray-500 pr-3 text-right border-b flex items-center justify-end"
                    >
                      {time}
                    </div>
                  ))}
                  {/* Add 00:00 time slot at the bottom explicitly */}
                  <div className="h-12 text-xs text-gray-500 pr-3 text-right border-b flex items-center justify-end">
                    00:00
                  </div>
                </div>

                {/* Days of the week content cells */}
                {weekDays.map((day, dayIndex) => (
                  <div
                    key={dayIndex}
                    className={`col-span-1 relative bg-white
                      ${dayIndex < weekDays.length - 1 ? "border-r" : ""}
                      ${isSameDay(day, selectedDate) ? "bg-blue-50/20" : ""}`}
                    onClick={() => handleDateSelect(day)}
                  >
                    {/* Time cells */}
                    <div className="relative">
                      {TIME_SLOTS.map((_, i) => (
                        <div key={i} className="h-12 border-b"></div>
                      ))}
                      {/* Add extra cell for 00:00 */}
                      <div className="h-12 border-b"></div>

                      {/* Current time indicator */}
                      {isToday(day) && (
                        <div
                          className="absolute left-0 right-0 border-t border-red-500 z-20"
                          style={{
                            top: `${
                              (new Date().getHours() +
                                new Date().getMinutes() / 60) *
                              3
                            }rem`,
                          }}
                        >
                          <div className="absolute -left-1 -top-1.5 w-2 h-2 rounded-full bg-red-500"></div>
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
                              className={`absolute left-0.5 right-0.5 ${event.color} z-10 overflow-visible rounded-sm`}
                              style={{
                                top: `calc(${position.top} + ${topOffset}rem)`,
                                height: position.height,
                                opacity: 0.95, // Slightly transparent to help with overlap
                              }}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDateSelect(event.startDate);
                              }}
                            >
                              <div className="px-2 py-1.5 h-full flex flex-col justify-between">
                                <div>
                                  <div className="font-medium text-xs">
                                    {event.title}
                                  </div>

                                  {event.startTime && event.endTime && (
                                    <div className="text-[10px] mt-0.5 text-gray-700 flex items-center">
                                      <Clock className="h-2.5 w-2.5 mr-0.5 inline-block flex-shrink-0" />
                                      <span>
                                        {event.startTime} - {event.endTime}
                                      </span>
                                    </div>
                                  )}
                                </div>

                                <div className="text-[10px] text-gray-700 mt-1">
                                  {event.company}
                                </div>

                                {/* Red marker on right edge */}
                                <div className="absolute right-0 top-0 bottom-0 w-1 bg-red-500"></div>
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
    </Layout>
  );
};

export default CalendarPage;
