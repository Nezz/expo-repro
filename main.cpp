// run_loop::dispatch() pops an unsubscribed item while it holds state->lock, so the item's captures are destroyed
// under that lock. Usage: repro <dropped|subscribed|dropped-two-threads>
#include <rxcpp/rx.hpp>

#include <atomic>
#include <chrono>
#include <cstdio>
#include <cstring>
#include <mutex>
#include <thread>
#include <unistd.h>

namespace rxsc = rxcpp::schedulers;

struct SchedulesOnDestroy {
    rxsc::worker target;
    std::mutex* userLock;
    explicit SchedulesOnDestroy(rxsc::worker w, std::mutex* m) : target(std::move(w)), userLock(m) {}
    ~SchedulesOnDestroy() {
        std::unique_lock<std::mutex> guard;
        if (userLock) guard = std::unique_lock<std::mutex>(*userLock);
        target.schedule([](const rxsc::schedulable&) {});
    }
};

int main(int argc, char** argv) {
    const char* mode = argc > 1 ? argv[1] : "dropped";
    const bool dropItem = std::strcmp(mode, "subscribed") != 0;
    const bool twoThreads = std::strcmp(mode, "dropped-two-threads") == 0;

    rxsc::run_loop rl;
    auto sc = rl.get_scheduler();
    auto target = sc.create_worker();

    std::mutex userLock;
    rxcpp::composite_subscription itemLifetime;
    auto itemWorker = sc.create_worker(itemLifetime);
    {
        auto payload = std::make_shared<SchedulesOnDestroy>(target, twoThreads ? &userLock : nullptr);
        itemWorker.schedule([payload](const rxsc::schedulable&) {});
    }
    if (dropItem) itemLifetime.unsubscribe();

    std::atomic<bool> done{false};
    std::thread([&] {
        std::this_thread::sleep_for(std::chrono::seconds(2));
        if (!done) {
            std::printf("%s: HANG, dispatch() has not returned after 2 s\n", mode);
            std::fflush(stdout);
            _exit(1);
        }
    }).detach();

    std::thread other;
    if (twoThreads) {
        // Another thread schedules while it holds the lock the item's destructor needs.
        std::atomic<bool> holding{false};
        other = std::thread([&] {
            std::lock_guard<std::mutex> guard(userLock);
            holding = true;
            std::this_thread::sleep_for(std::chrono::milliseconds(200));
            target.schedule([](const rxsc::schedulable&) {});
        });
        while (!holding) std::this_thread::yield();
    }

    rl.dispatch();
    if (other.joinable()) other.join();
    done = true;
    std::printf("%s: OK, dispatch() returned\n", mode);
    return 0;
}
