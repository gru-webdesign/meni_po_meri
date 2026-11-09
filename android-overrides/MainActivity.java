package rs.gru.menipomeri;

import android.os.Bundle;
import android.webkit.WebSettings;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        // Sistemsko uvećanje teksta se poštuje, ali najviše do 115% da raspored ostane čitljiv
        try {
            WebSettings s = getBridge().getWebView().getSettings();
            if (s.getTextZoom() > 115) s.setTextZoom(115);
        } catch (Exception ignored) {}
    }
}
