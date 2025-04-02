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
  "bg-blue-50 border-blue-200 text-blue-800",
  "bg-green-50 border-green-200 text-green-800",
  "bg-purple-50 border-purple-200 text-purple-800",
  "bg-orange-50 border-orange-200 text-orange-800",
  "bg-rose-50 border-rose-200 text-rose-800",
  "bg-cyan-50 border-cyan-200 text-cyan-800",
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

  // Filter events that fall within the current week
  const eventsThisWeek = useMemo(() => {
    return calendarEvents.filter((event) => {
      const eventDate = event.startDate;
      return eventDate >= weekInterval.start && eventDate <= weekInterval.end;
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

    // Calculate position and height based on time - now based on 24 hours
    const startPosition = startHour + startMinute / 60; // Hour is now the direct offset
    const duration = endHour - startHour + (endMinute - startMinute) / 60;

    return {
      top: `${startPosition * 3}rem`, // 3rem per hour (adjusted for smaller cells)
      height: `${Math.max(duration * 3, 1.25)}rem`, // Minimum height
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
      <div className="space-y-4">
        {/* Header with navigation */}
        <div className="flex justify-between items-center mb-2">
          <h1 className="text-xl font-bold tracking-tight">Calendar</h1>
        </div>

        {/* Main content area with date selector, day view and week view */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Date Selector and Selected Date View */}
          <div className="md:col-span-1">
            <div className="bg-white rounded-lg overflow-hidden mb-4">
              <div className="px-3 py-2 border-b">
                <h2 className="text-sm font-medium">Select Date</h2>
              </div>
              <div className="p-0">
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
                    highlighted: "bg-blue-100",
                    selected: "bg-blue-600 text-white",
                    today: "text-blue-900 font-medium border border-blue-300",
                  }}
                  classNames={{
                    day: "h-8 w-8 p-0 font-normal text-xs",
                    day_selected:
                      "bg-blue-600 text-white font-medium hover:bg-blue-600 hover:text-white",
                    day_today: "text-blue-900 font-medium",
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
              </div>
            </div>

            {/* Selected Date Details Box */}
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              <div className="px-3 py-2 bg-gray-50 border-b">
                <div className="flex items-center text-sm font-medium">
                  <CalendarIcon className="mr-1.5 h-3.5 w-3.5" />
                  {format(selectedDate, "EEEE, MMMM d")}
                  {isToday(selectedDate) && (
                    <Badge className="ml-1.5 px-1.5 py-0 h-4 text-[10px] bg-blue-500 hover:bg-blue-600">
                      Today
                    </Badge>
                  )}
                </div>
              </div>
              <div className="max-h-[calc(100vh-350px)] overflow-y-auto">
                {selectedDateEvents.length > 0 ? (
                  <div>
                    {Object.entries(groupedEvents).map(([time, events]) => (
                      <div key={time}>
                        <div className="flex items-center pl-4 pt-3 pb-1">
                          <div className="text-xs text-blue-600 font-medium w-10">
                            {time}
                          </div>
                        </div>
                        <div>
                          {events.map((event, index) => (
                            <div
                              key={`${event.jobId}-${index}`}
                              className={`border-l-4 ${event.color.replace(
                                "bg-",
                                "border-"
                              )} px-4 py-3 mb-2 hover:bg-gray-50`}
                            >
                              <div className="font-medium text-sm">
                                {event.title}
                              </div>
                              <div className="text-xs text-gray-500 mt-1">
                                {event.company}
                              </div>
                              {event.description && (
                                <div className="mt-1 text-xs text-gray-700">
                                  {event.description.includes("Applied for") ? (
                                    <>
                                      Applied for{" "}
                                      <span className="font-medium">
                                        {event.position}
                                      </span>{" "}
                                      at {event.company}
                                    </>
                                  ) : (
                                    event.description
                                  )}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                    <CalendarIcon className="h-8 w-8 mb-2 opacity-20" />
                    <p className="text-xs">No events scheduled</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Week View - Takes most of the space */}
          <div className="md:col-span-3">
            <div className="bg-white rounded-lg shadow-sm overflow-hidden h-full">
              <div className="px-3 py-2 border-b flex justify-between items-center">
                <h2 className="text-sm font-medium">
                  {format(weekInterval.start, "MMMM d")} -{" "}
                  {format(weekInterval.end, "d, yyyy")}
                </h2>
                <div className="flex items-center rounded-md bg-gray-100 p-0.5">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={goToPreviousWeek}
                    className="h-6 w-6 p-0 rounded-sm hover:bg-white hover:text-blue-600"
                  >
                    <ChevronLeft className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={goToCurrentWeek}
                    className="h-6 px-2 text-xs rounded-sm hover:bg-white hover:text-blue-600 mx-0.5"
                  >
                    Today
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={goToNextWeek}
                    className="h-6 w-6 p-0 rounded-sm hover:bg-white hover:text-blue-600"
                  >
                    <ChevronRight className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
              <div className="grid grid-cols-8 bg-white">
                {/* Fixed headers row */}
                <div className="col-span-1 bg-gray-50">
                  <div className="h-8"></div> {/* Empty corner cell */}
                </div>
                {weekDays.map((day, dayIndex) => (
                  <div
                    key={dayIndex}
                    className={`col-span-1 border-l h-8 flex items-center justify-center cursor-pointer border-b ${
                      isToday(day) ? "bg-blue-50" : ""
                    }`}
                    onClick={() => handleDateSelect(day)}
                  >
                    <div className="text-center">
                      <div className="text-xs text-gray-500">
                        {format(day, "EEE").toUpperCase()}
                      </div>
                      <div
                        className={`text-xs font-medium mt-0.5 ${
                          isSameDay(day, selectedDate) ? "text-blue-600" : ""
                        }`}
                      >
                        {format(day, "d")}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Scrollable time grid */}
              <div className="grid grid-cols-8 bg-white h-[calc(100vh-230px)] overflow-y-auto">
                {/* Time slots column */}
                <div className="col-span-1 sticky left-0 bg-gray-50 z-10">
                  {TIME_SLOTS.map((time, i) => (
                    <div
                      key={i}
                      className="h-12 text-xs text-gray-500 pr-3 text-right border-t flex items-center justify-end"
                    >
                      {time}
                    </div>
                  ))}
                </div>

                {/* Days of the week content cells */}
                {weekDays.map((day, dayIndex) => (
                  <div
                    key={dayIndex}
                    className={`col-span-1 border-l ${
                      isSameDay(day, selectedDate) ? "bg-blue-50/30" : ""
                    } ${isToday(day) ? "bg-blue-50/20" : ""}`}
                    onClick={() => handleDateSelect(day)}
                  >
                    {/* Time cells and events */}
                    <div className="relative">
                      {TIME_SLOTS.map((_, i) => (
                        <div
                          key={i}
                          className="h-12 border-t border-gray-100"
                        ></div>
                      ))}

                      {/* Current time indicator */}
                      {isToday(day) && (
                        <div
                          className="absolute left-0 right-0 border-t border-red-400 z-20"
                          style={{
                            top: `${
                              (new Date().getHours() +
                                new Date().getMinutes() / 60) *
                              3
                            }rem`,
                          }}
                        >
                          <div className="absolute -left-1 -top-1.5 w-2 h-2 rounded-full bg-red-400"></div>
                        </div>
                      )}

                      {/* Events for this day */}
                      {eventsThisWeek.map((event, eventIndex) => {
                        const position = getEventPosition(event, day);
                        if (!position) return null;

                        return (
                          <div
                            key={eventIndex}
                            className={`absolute left-1 right-1 rounded-sm border px-1.5 py-0.5 overflow-hidden ${event.color} cursor-pointer hover:opacity-90 z-10`}
                            style={{
                              top: position.top,
                              height: position.height,
                            }}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDateSelect(event.startDate);
                            }}
                          >
                            <div className="text-xs font-medium truncate">
                              {event.title}
                            </div>
                            {event.startTime && event.endTime && (
                              <div className="text-[10px] opacity-70">
                                {event.startTime} - {event.endTime}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default CalendarPage;
