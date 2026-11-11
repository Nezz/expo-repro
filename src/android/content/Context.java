package android.content;

// Stand-in for the platform class: FontLoader only reads Context.getCacheDir() when no cache dir is passed.
public abstract class Context {
    public java.io.File getCacheDir() { return null; }
}
