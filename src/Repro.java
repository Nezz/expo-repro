import com.revenuecat.purchases.LogHandler;
import com.revenuecat.purchases.UiConfig;
import com.revenuecat.purchases.common.LogWrapperKt;
import com.revenuecat.purchases.paywalls.FontLoader;
import com.revenuecat.purchases.paywalls.components.properties.FontStyle;
import com.revenuecat.purchases.utils.DefaultUrlConnectionFactory;
import java.io.File;
import java.nio.file.Files;
import java.util.List;
import java.util.concurrent.CopyOnWriteArrayList;
import kotlinx.coroutines.CoroutineScopeKt;
import kotlinx.coroutines.Dispatchers;

// A paywall with two remote fonts, loaded for the first time: FontLoader starts one download per font on
// Dispatchers.IO, and each checks that the cache folder exists before downloading.
public class Repro {
    public static void main(String[] args) throws Exception {
        int runs = 200;
        int failedRuns = 0;
        for (int run = 0; run < runs; run++) {
            List<String> errors = new CopyOnWriteArrayList<>();
            LogWrapperKt.setCurrentLogHandler(new LogHandler() {
                public void v(String tag, String msg) {}
                public void d(String tag, String msg) {}
                public void i(String tag, String msg) {}
                public void w(String tag, String msg) {}
                public void e(String tag, String msg, Throwable t) { errors.add(msg); }
            });
            File cacheDir = new File(Files.createTempDirectory("rc-fonts").toFile(), "rc_paywall_fonts");
            FontLoader loader = new FontLoader(new Context(), cacheDir,
                CoroutineScopeKt.CoroutineScope(Dispatchers.getIO()), new DefaultUrlConnectionFactory());
            for (String name : new String[] {"Regular", "Bold"}) {
                // 127.0.0.1:9 refuses the connection: the download itself isn't under test.
                loader.getCachedFontFamilyOrStartDownload(new UiConfig.AppConfig.FontsConfig.FontInfo.Name(
                    "Inter-" + name, "http://127.0.0.1:9/Inter-" + name + ".ttf",
                    "0123456789abcdef0123456789abcdef", "Inter", 400, FontStyle.NORMAL));
            }
            Thread.sleep(300);
            boolean raced = errors.stream().anyMatch(m -> m.startsWith("Unable to create cache directory for remote fonts"));
            if (raced) {
                failedRuns++;
                if (failedRuns == 1) {
                    System.out.println("run " + run + ": " + errors.stream().filter(m -> m.startsWith("Unable")).findFirst().get());
                    System.out.println("  the folder exists afterwards: " + cacheDir.isDirectory());
                    errors.forEach(m -> System.out.println("  logged: " + m));
                }
            }
        }
        System.out.println(failedRuns + " of " + runs + " first loads logged 'Unable to create cache directory' and skipped a font");
        System.exit(failedRuns > 0 ? 1 : 0);
    }

    static class Context extends android.content.Context {}
}
