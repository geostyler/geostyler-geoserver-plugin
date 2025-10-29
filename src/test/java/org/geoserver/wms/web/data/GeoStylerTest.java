package org.geoserver.wms.web.data;

import java.io.FileReader;
import java.io.IOException;
import java.net.URISyntaxException;
import org.apache.commons.io.IOUtils;
import org.apache.wicket.util.file.File;
import org.apache.wicket.util.tester.FormTester;
import org.geoserver.web.GeoServerWicketTestSupport;
import org.junit.Test;

public class GeoStylerTest extends GeoServerWicketTestSupport {

    @Test
    public void rendersTheStylePageIncludingTheGeoStyler() throws IOException, URISyntaxException {
        login();
        tester.startPage(StyleNewPage.class);

        FormTester form = tester.newFormTester("styleForm");

        File styleFile = new File(new java.io.File(
                getClass().getClassLoader().getResource("default_point.sld").toURI()));
        String sld = IOUtils.toString(new FileReader(styleFile))
                .replaceAll("\r\n", "\n")
                .replaceAll("\r", "\n");
        form.setValue("context:panel:name", "default_point_style");
        form.setValue("styleEditor:editorContainer:editorParent:editor", sld);
        form.submit();

        tester.assertComponent("styleForm:geoStyler", GeoStyler.class);
        tester.assertRenderedPage(StyleNewPage.class);
    }
}
