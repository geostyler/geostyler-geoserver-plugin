/* (c) 2016 Open Source Geospatial Foundation - all rights reserved
 * This code is licensed under the GPL 2.0 license, available at the root
 * application directory.
 */

package org.geoserver.wms.web.data;

import static org.geoserver.template.TemplateUtils.FM_VERSION;

import freemarker.template.Configuration;
import freemarker.template.DefaultObjectWrapper;
import freemarker.template.Template;
import freemarker.template.TemplateException;
import java.io.IOException;
import java.io.StringWriter;
import java.util.HashMap;
import java.util.Map;
import java.util.logging.Logger;
import org.apache.commons.lang.StringUtils;
import org.apache.wicket.WicketRuntimeException;
import org.apache.wicket.javascript.DefaultJavaScriptCompressor;
import org.apache.wicket.markup.head.CssHeaderItem;
import org.apache.wicket.markup.head.IHeaderResponse;
import org.apache.wicket.markup.head.JavaScriptHeaderItem;
import org.apache.wicket.markup.head.OnLoadHeaderItem;
import org.apache.wicket.markup.html.panel.Panel;
import org.apache.wicket.request.Request;
import org.apache.wicket.request.http.WebRequest;
import org.apache.wicket.request.resource.PackageResourceReference;
import org.apache.wicket.resource.NoOpTextCompressor;
import org.geoserver.catalog.LayerInfo;
import org.geoserver.catalog.ResourceInfo;
import org.geoserver.template.TemplateUtils;
import org.geoserver.web.GeoServerApplication;
import org.geotools.util.logging.Logging;

public class GeoStyler extends Panel {

    private static final Logger LOGGER = Logging.getLogger(GeoStyler.class);

    private static final Configuration templates;

    private AbstractStylePage parent;

    static {
        templates = TemplateUtils.getSafeConfiguration();
        templates.setClassForTemplateLoading(GeoStyler.class, "");
        templates.setObjectWrapper(new DefaultObjectWrapper(FM_VERSION));
    }

    /**
     * Constructor
     *
     * @param id The id given to the component.
     * @param parent The parenting AbstractStylePage
     */
    public GeoStyler(String id, AbstractStylePage parent) {
        super(id);
        this.parent = parent;
        LOGGER.info("Created a new instance of GeoStyler");
    }

    /**
     * Add required CSS and Javascript resources
     *
     * @param header
     */
    @Override
    public void renderHead(IHeaderResponse header) {
        super.renderHead(header);
        try {
            renderHeaderCss(header);
            renderHeaderScript(header);
        } catch (IOException | TemplateException e) {
            throw new WicketRuntimeException(e);
        }
    }

    /**
     * Renders header CSS
     *
     * @param header
     * @throws IOException
     * @throws TemplateException
     */
    private void renderHeaderCss(IHeaderResponse header) throws IOException, TemplateException {
        StringWriter css = new java.io.StringWriter();
        header.render(CssHeaderItem.forCSS(css.toString(), "geostyler-css"));
    }

    /**
     * Renders header scripts
     *
     * @param header
     * @throws IOException
     * @throws TemplateException
     */
    private void renderHeaderScript(IHeaderResponse header) throws IOException, TemplateException {
        String styleFormat = parent.getStyleInfo().getFormat();

        if (!styleFormat.equals("sld")) {
            LOGGER.info("Don't render GeoStyler for format " + styleFormat + " as it is not supported.");
            return;
        }

        Map<String, Object> context = new HashMap<>();
        LayerInfo layerInfo = parent.getLayerInfo();
        ResourceInfo resource = layerInfo.getResource();
        if (resource != null) {
            context.put("layer", layerInfo.prefixedName());
            context.put("layerType", layerInfo.getType());
        } else {
            context.put("layer", StringUtils.EMPTY);
            context.put("layerType", StringUtils.EMPTY);
        }

        context.put("basePath", getContextPath() + "/ows");

        Template template = templates.getTemplate("geostyler-init.ftl");
        StringWriter script = new java.io.StringWriter();
        template.process(context, script);

        // temporarily disable javascript compression since build resources are already
        // compressed
        GeoServerApplication.get().getResourceSettings().setJavaScriptCompressor(new NoOpTextCompressor());
        header.render(CssHeaderItem.forReference(new PackageResourceReference(GeoStyler.class, "lib/geostyler.css")));
        header.render(CssHeaderItem.forReference(new PackageResourceReference(GeoStyler.class, "lib/reset.css")));
        header.render(JavaScriptHeaderItem.forReference(
                new PackageResourceReference(GeoStyler.class, "lib/react.production.min.js")));
        header.render(JavaScriptHeaderItem.forReference(
                new PackageResourceReference(GeoStyler.class, "lib/react-dom.production.min.js")));
        header.render(
                JavaScriptHeaderItem.forReference(new PackageResourceReference(GeoStyler.class, "lib/dayjs.min.js")));
        header.render(
                JavaScriptHeaderItem.forReference(new PackageResourceReference(GeoStyler.class, "lib/antd.min.js")));
        header.render(JavaScriptHeaderItem.forReference(new PackageResourceReference(GeoStyler.class, "lib/ol.js")));
        header.render(JavaScriptHeaderItem.forReference(
                new PackageResourceReference(GeoStyler.class, "lib/geostyler.iife.js")));
        header.render(JavaScriptHeaderItem.forReference(
                new PackageResourceReference(GeoStyler.class, "lib/geoJsonDataParser.iife.js")));
        header.render(JavaScriptHeaderItem.forReference(
                new PackageResourceReference(GeoStyler.class, "lib/sldStyleParser.iife.js")));
        header.render(JavaScriptHeaderItem.forReference(
                new PackageResourceReference(GeoStyler.class, "lib/wfsDataParser.iife.js")));
        header.render(OnLoadHeaderItem.forScript(script.toString()));
    }

    /** As soon as the {@link GeoStyler} is removed the default Javascript compression needs to be enabled */
    @Override
    protected void onRemove() {
        // (re-) enable javascript compression
        GeoServerApplication.get().getResourceSettings().setJavaScriptCompressor(new DefaultJavaScriptCompressor());
        super.onRemove();
    }

    private String getContextPath() {
        final Request request = getRequest();
        if (request instanceof WebRequest) {
            final WebRequest wr = (WebRequest) request;
            return wr.getContextPath();
        }
        return null;
    }
}
