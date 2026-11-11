package android.content.pm;

// Stand-in for the platform class, which FontLoader's download coroutine references.
public abstract class PackageManager {
    public static class NameNotFoundException extends Exception {}
}
