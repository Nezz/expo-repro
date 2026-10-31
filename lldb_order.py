# Breakpoint callbacks for lldb-order.txt: append one line per hit to the
# file named by ORDER_LOG, with the stopping thread's name.
import os
import time

LOG = os.environ.get("ORDER_LOG", "lldb-order.log")


def note(frame, label, extra=""):
    thread = frame.GetThread()
    name = thread.GetName() or thread.GetQueueName() or "?"
    with open(LOG, "a") as f:
        f.write("%.6f  #%d %-40s %s %s\n" % (time.time(), thread.GetIndexID(), name, label, extra))


def stop_surface(frame, bp_loc, internal_dict):
    note(frame, "UIManager::stopSurface")
    frame.GetThread().GetProcess().GetTarget().FindBreakpointByID(4).SetEnabled(True)
    return False


def dispatch_command(frame, bp_loc, internal_dict):
    note(frame, "Scheduler::uiManagerDidDispatchCommand", frame.FindVariable("commandName").GetSummary())
    return False


def scheduler_dealloc(frame, bp_loc, internal_dict):
    note(frame, "-[RCTScheduler dealloc]")
    return False


def update_rendering(frame, bp_loc, internal_dict):
    note(frame, "RuntimeScheduler_Modern::updateRendering")
    return False
