'use client'

export default function DesignTestPage() {
  return (
    <div className="min-h-screen bg-[#ffffff] p-8">
      <div className="max-w-6xl mx-auto space-y-12">
        <header className="mb-12">
          <h1 className="font-display text-4xl font-bold" style={{ color: 'var(--text-headings)' }}>
            Design System Showcase
          </h1>
          <p className="font-body text-base" style={{ color: 'var(--text-body)' }}>
            Visual reference for all design tokens
          </p>
        </header>

        {/* Background Colors */}
        <section className="space-y-4">
          <h2 className="font-ui text-2xl font-semibold" style={{ color: 'var(--text-headings)' }}>Background Colors</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <div className="h-24 rounded-lg border" style={{ backgroundColor: 'var(--bg-main)', borderColor: 'var(--border-card)' }}></div>
              <p className="font-ui text-sm" style={{ color: 'var(--text-body)' }}>bg-main</p>
              <p className="font-mono text-xs" style={{ color: 'var(--text-secondary)' }}>#c7c7c2</p>
            </div>
            <div className="space-y-2">
              <div className="h-24 rounded-lg border" style={{ backgroundColor: 'var(--bg-menu-bar)', borderColor: 'var(--border-card)' }}></div>
              <p className="font-ui text-sm" style={{ color: 'var(--text-body)' }}>bg-menu-bar</p>
              <p className="font-mono text-xs" style={{ color: 'var(--text-secondary)' }}>#0B0A0A</p>
            </div>
            <div className="space-y-2">
              <div className="h-24 rounded-lg border" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-card)' }}></div>
              <p className="font-ui text-sm" style={{ color: 'var(--text-body)' }}>bg-card</p>
              <p className="font-mono text-xs" style={{ color: 'var(--text-secondary)' }}>#E9E3E0</p>
            </div>
            <div className="space-y-2">
              <div className="h-24 rounded-lg border" style={{ backgroundColor: 'var(--bg-profile)', borderColor: 'var(--border-card)' }}></div>
              <p className="font-ui text-sm" style={{ color: 'var(--text-body)' }}>bg-profile</p>
              <p className="font-mono text-xs" style={{ color: 'var(--text-secondary)' }}>#121212</p>
            </div>
            <div className="space-y-2">
              <div className="h-24 rounded-lg border" style={{ backgroundColor: 'var(--bg-info-menu)', borderColor: 'var(--border-card)' }}></div>
              <p className="font-ui text-sm" style={{ color: 'var(--text-body)' }}>bg-info-menu</p>
              <p className="font-mono text-xs" style={{ color: 'var(--text-secondary)' }}>#1a1618</p>
            </div>
            <div className="space-y-2">
              <div className="h-24 rounded-lg border" style={{ backgroundColor: 'var(--bg-gray-800)', borderColor: 'var(--border-card)' }}></div>
              <p className="font-ui text-sm" style={{ color: 'var(--text-body)' }}>bg-gray-800</p>
              <p className="font-mono text-xs" style={{ color: 'var(--text-secondary)' }}>#181416</p>
            </div>
            <div className="space-y-2">
              <div className="h-24 rounded-lg border" style={{ backgroundColor: 'var(--bg-gray-700)', borderColor: 'var(--border-card)' }}></div>
              <p className="font-ui text-sm" style={{ color: 'var(--text-body)' }}>bg-gray-700</p>
              <p className="font-mono text-xs" style={{ color: 'var(--text-secondary)' }}>#272223</p>
            </div>
          </div>
        </section>

        {/* Text Colors */}
        <section className="space-y-4">
          <h2 className="font-ui text-2xl font-semibold" style={{ color: 'var(--text-headings)' }}>Text Colors</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-6 rounded-lg space-y-3" style={{ backgroundColor: 'var(--bg-main)' }}>
              <h3 className="font-ui text-sm font-semibold mb-3" style={{ color: 'var(--text-secondary)' }}>On Light Backgrounds</h3>
              <p className="font-body text-base" style={{ color: 'var(--text-headings)' }}>text-headings (#111111)</p>
              <p className="font-body text-base" style={{ color: 'var(--text-body)' }}>text-body (#1a1a1a)</p>
              <p className="font-body text-base" style={{ color: 'var(--text-secondary)' }}>text-secondary (#4a4a4a)</p>
              <p className="font-body text-base" style={{ color: 'var(--text-metadata)' }}>text-metadata (#5a5a5a)</p>
            </div>
            <div className="p-6 rounded-lg space-y-3" style={{ backgroundColor: 'var(--bg-menu-bar)' }}>
              <h3 className="font-ui text-sm font-semibold mb-3" style={{ color: 'var(--text-on-dark-secondary)' }}>On Dark Backgrounds</h3>
              <p className="font-body text-base" style={{ color: 'var(--text-on-dark)' }}>text-on-dark (#e0e0e0)</p>
              <p className="font-body text-base" style={{ color: 'var(--text-on-dark-secondary)' }}>text-on-dark-secondary (#b0b0b0)</p>
              <p className="font-body text-base" style={{ color: 'var(--text-on-dark-inactive)' }}>text-on-dark-inactive (#808080)</p>
            </div>
          </div>
        </section>

        {/* Accent Colors */}
        <section className="space-y-4">
          <h2 className="font-ui text-2xl font-semibold" style={{ color: 'var(--text-headings)' }}>Accent Colors (Burgundy Family)</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 rounded-lg space-y-3" style={{ backgroundColor: 'var(--bg-main)' }}>
              <div className="h-16 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'var(--accent-light)' }}>
                <span className="font-ui text-sm font-semibold text-white">accent-light</span>
              </div>
              <p className="font-mono text-xs" style={{ color: 'var(--text-secondary)' }}>#6B2A2A</p>
              <p className="font-body text-sm" style={{ color: 'var(--text-body)' }}>Primary burgundy accent. Replaces emerald-400, emerald-700, purple-600, blue.</p>
            </div>
            <div className="p-6 rounded-lg space-y-3" style={{ backgroundColor: 'var(--bg-main)' }}>
              <div className="h-16 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'var(--accent-dark)' }}>
                <span className="font-ui text-sm font-semibold text-white">accent-dark</span>
              </div>
              <p className="font-mono text-xs" style={{ color: 'var(--text-secondary)' }}>#fc5454</p>
              <p className="font-body text-sm" style={{ color: 'var(--text-body)' }}>Darker burgundy for selected states.</p>
            </div>
            <div className="p-6 rounded-lg space-y-3" style={{ backgroundColor: 'var(--bg-main)' }}>
              <div className="h-16 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'var(--accent-emerald-300)' }}>
                <span className="font-ui text-sm font-semibold text-white">accent-emerald-300</span>
              </div>
              <p className="font-mono text-xs" style={{ color: 'var(--text-secondary)' }}>#A85A5A</p>
              <p className="font-body text-sm" style={{ color: 'var(--text-body)' }}>Hover states (only emerald variant kept).</p>
            </div>
          </div>
        </section>

        {/* Typography */}
        <section className="space-y-4">
          <h2 className="font-ui text-2xl font-semibold" style={{ color: 'var(--text-headings)' }}>Typography</h2>
          
          <div className="p-6 rounded-lg space-y-6" style={{ backgroundColor: 'var(--bg-main)' }}>
            <div>
              <h3 className="font-ui text-sm font-semibold mb-3" style={{ color: 'var(--text-secondary)' }}>Crimson Pro (Display Font)</h3>
              <h1 className="font-display text-4xl font-bold mb-2" style={{ color: 'var(--text-headings)' }}>Profile Name</h1>
              <h2 className="font-display text-3xl font-semibold mb-2" style={{ color: 'var(--text-headings)' }}>Content Title</h2>
              <h3 className="font-display text-2xl font-semibold" style={{ color: 'var(--text-headings)' }}>Resume Entry Title</h3>
              <p className="font-body text-sm mt-2" style={{ color: 'var(--text-metadata)' }}>Used for: Profile name, content titles, resume entry titles, timeline "Now" marker, info menu sticky title</p>
            </div>

            <div>
              <h3 className="font-ui text-sm font-semibold mb-3" style={{ color: 'var(--text-secondary)' }}>Public Sans (Body Font)</h3>
              <p className="font-body text-base leading-relaxed mb-2" style={{ color: 'var(--text-body)' }}>
                This is body text using Public Sans. It's used for content body, profile bio, resume entry descriptions, and info menu values. The font provides excellent readability for longer text passages.
              </p>
              <p className="font-body text-sm leading-relaxed" style={{ color: 'var(--text-body)' }}>
                Smaller body text example. Used for secondary content and metadata values.
              </p>
              <p className="font-body text-sm mt-2" style={{ color: 'var(--text-metadata)' }}>Used for: Content body, profile bio, resume entry descriptions, info menu values</p>
            </div>

            <div>
              <h3 className="font-ui text-sm font-semibold mb-3" style={{ color: 'var(--text-secondary)' }}>Space Grotesk (UI Font)</h3>
              <button className="font-ui text-sm font-medium px-4 py-2 rounded-lg mb-2" style={{ backgroundColor: 'var(--bg-menu-bar)', color: 'var(--text-on-dark)' }}>
                PORTFOLIO
              </button>
              <p className="font-ui text-base mb-2" style={{ color: 'var(--text-body)' }}>Menu Item Text</p>
              <p className="font-ui text-sm" style={{ color: 'var(--text-metadata)' }}>January 2024 - Present</p>
              <p className="font-body text-sm mt-2" style={{ color: 'var(--text-metadata)' }}>Used for: Bottom nav tabs, main menu items, profile section titles, resume entry dates</p>
            </div>

            <div>
              <h3 className="font-ui text-sm font-semibold mb-3" style={{ color: 'var(--text-secondary)' }}>JetBrains Mono (Monospace Font)</h3>
              <code className="font-mono text-sm px-2 py-1 rounded" style={{ backgroundColor: 'var(--bg-gray-800)', color: 'var(--text-body)' }}>
                const example = 'code';
              </code>
              <p className="font-body text-sm mt-2" style={{ color: 'var(--text-metadata)' }}>Used for: Code snippets and technical content</p>
            </div>
          </div>
        </section>

        {/* Font Sizes */}
        <section className="space-y-4">
          <h2 className="font-ui text-2xl font-semibold" style={{ color: 'var(--text-headings)' }}>Font Size Scale</h2>
          <div className="p-6 rounded-lg space-y-3" style={{ backgroundColor: 'var(--bg-main)' }}>
            <p className="font-body text-xs" style={{ color: 'var(--text-body)' }}>text-xs (0.75rem / 12px)</p>
            <p className="font-body text-sm" style={{ color: 'var(--text-body)' }}>text-sm (0.875rem / 14px)</p>
            <p className="font-body text-base" style={{ color: 'var(--text-body)' }}>text-base (1rem / 16px) - DEFAULT</p>
            <p className="font-body text-lg" style={{ color: 'var(--text-body)' }}>text-lg (1.125rem / 18px)</p>
            <p className="font-body text-xl" style={{ color: 'var(--text-body)' }}>text-xl (1.25rem / 20px)</p>
            <p className="font-body text-2xl" style={{ color: 'var(--text-body)' }}>text-2xl (1.5rem / 24px)</p>
            <p className="font-body text-3xl" style={{ color: 'var(--text-body)' }}>text-3xl (1.875rem / 30px)</p>
          </div>
        </section>

        {/* Font Usage Guide */}
        <section className="space-y-4">
          <h2 className="font-ui text-2xl font-semibold" style={{ color: 'var(--text-headings)' }}>Font Usage Guide</h2>
          
          <div className="space-y-6">
            {/* Crimson Pro Usage */}
            <div className="p-6 rounded-lg" style={{ backgroundColor: 'var(--bg-main)' }}>
              <h3 className="font-ui text-lg font-semibold mb-4" style={{ color: 'var(--text-headings)' }}>Crimson Pro (Display Font)</h3>
              <p className="font-body text-sm mb-4" style={{ color: 'var(--text-body)' }}>
                Use for: Headings, titles, and display text. Available weights: 400, 600, 700. Letter spacing: -0.015em for headings.
              </p>
              <div className="space-y-3">
                <div>
                  <p className="font-ui text-xs font-semibold mb-1 uppercase" style={{ color: 'var(--text-secondary)' }}>Profile Name</p>
                  <h1 className="font-display text-2xl font-bold uppercase" style={{ color: 'var(--text-headings)' }}>YOUR NAME</h1>
                </div>
                <div>
                  <p className="font-ui text-xs font-semibold mb-1 uppercase" style={{ color: 'var(--text-secondary)' }}>Content Title</p>
                  <h1 className="font-display text-3xl font-bold" style={{ color: 'var(--text-headings)' }}>Article Title Here</h1>
                </div>
                <div>
                  <p className="font-ui text-xs font-semibold mb-1 uppercase" style={{ color: 'var(--text-secondary)' }}>Resume Entry Title</p>
                  <h3 className="font-display text-xl font-semibold" style={{ color: 'var(--text-headings)' }}>Job Title</h3>
                </div>
                <div>
                  <p className="font-ui text-xs font-semibold mb-1 uppercase" style={{ color: 'var(--text-secondary)' }}>Timeline "Now" Marker</p>
                  <p className="font-display text-2xl font-bold" style={{ color: 'var(--accent-light)' }}>Now</p>
                </div>
              </div>
            </div>

            {/* Public Sans Usage */}
            <div className="p-6 rounded-lg" style={{ backgroundColor: 'var(--bg-main)' }}>
              <h3 className="font-ui text-lg font-semibold mb-4" style={{ color: 'var(--text-headings)' }}>Public Sans (Body Font)</h3>
              <p className="font-body text-sm mb-4" style={{ color: 'var(--text-body)' }}>
                Use for: Body text, descriptions, and readable content. Available weights: 400, 500, 600. Line height: 1.625 (relaxed) for body text.
              </p>
              <div className="space-y-3">
                <div>
                  <p className="font-ui text-xs font-semibold mb-1 uppercase" style={{ color: 'var(--text-secondary)' }}>Content Body</p>
                  <p className="font-body text-base leading-relaxed" style={{ color: 'var(--text-body)' }}>
                    This is body text using Public Sans. It's used for article content, descriptions, and any longer-form text that requires excellent readability.
                  </p>
                </div>
                <div>
                  <p className="font-ui text-xs font-semibold mb-1 uppercase" style={{ color: 'var(--text-secondary)' }}>Profile Bio</p>
                  <p className="font-body text-sm leading-relaxed" style={{ color: 'var(--text-on-dark-secondary)' }}>
                    Short bio text that appears in the profile section. Uses smaller size for compact display.
                  </p>
                </div>
                <div>
                  <p className="font-ui text-xs font-semibold mb-1 uppercase" style={{ color: 'var(--text-secondary)' }}>Info Menu Value</p>
                  <p className="font-body text-sm" style={{ color: 'var(--text-on-dark-inactive)' }}>January 2024</p>
                </div>
              </div>
            </div>

            {/* Space Grotesk Usage */}
            <div className="p-6 rounded-lg" style={{ backgroundColor: 'var(--bg-main)' }}>
              <h3 className="font-ui text-lg font-semibold mb-4" style={{ color: 'var(--text-headings)' }}>Space Grotesk (UI Font)</h3>
              <p className="font-body text-sm mb-4" style={{ color: 'var(--text-body)' }}>
                Use for: UI elements, navigation, labels, and interface text. Available weights: 500, 600, 700. Letter spacing: 0.05em for uppercase labels.
              </p>
              <div className="space-y-3">
                <div>
                  <p className="font-ui text-xs font-semibold mb-1 uppercase" style={{ color: 'var(--text-secondary)' }}>Bottom Nav Tab</p>
                  <button className="font-ui text-sm font-semibold uppercase px-4 py-2 rounded-lg" style={{ backgroundColor: 'var(--bg-menu-bar)', color: 'var(--text-on-dark)' }}>
                    PORTFOLIO
                  </button>
                </div>
                <div>
                  <p className="font-ui text-xs font-semibold mb-1 uppercase" style={{ color: 'var(--text-secondary)' }}>Main Menu Item</p>
                  <p className="font-ui text-base" style={{ color: 'var(--text-body)' }}>Category Name</p>
                </div>
                <div>
                  <p className="font-ui text-xs font-semibold mb-1 uppercase" style={{ color: 'var(--text-secondary)' }}>Profile Section Title</p>
                  <h3 className="font-ui text-sm font-semibold uppercase tracking-wide" style={{ color: 'var(--text-on-dark-inactive)' }}>About</h3>
                </div>
                <div>
                  <p className="font-ui text-xs font-semibold mb-1 uppercase" style={{ color: 'var(--text-secondary)' }}>Resume Entry Date</p>
                  <p className="font-ui text-xs uppercase tracking-wider" style={{ color: 'var(--text-metadata)' }}>January 2024 - Present</p>
                </div>
              </div>
            </div>

            {/* JetBrains Mono Usage */}
            <div className="p-6 rounded-lg" style={{ backgroundColor: 'var(--bg-main)' }}>
              <h3 className="font-ui text-lg font-semibold mb-4" style={{ color: 'var(--text-headings)' }}>JetBrains Mono (Monospace Font)</h3>
              <p className="font-body text-sm mb-4" style={{ color: 'var(--text-body)' }}>
                Use for: Code snippets and technical content. Available weights: 300, 400, 500.
              </p>
              <div className="space-y-3">
                <div>
                  <p className="font-ui text-xs font-semibold mb-1 uppercase" style={{ color: 'var(--text-secondary)' }}>Inline Code</p>
                  <code className="font-mono text-sm px-2 py-1 rounded" style={{ backgroundColor: 'var(--bg-gray-800)', color: 'var(--text-body)' }}>
                    const example = 'code';
                  </code>
                </div>
                <div>
                  <p className="font-ui text-xs font-semibold mb-1 uppercase" style={{ color: 'var(--text-secondary)' }}>Code Block</p>
                  <pre className="font-mono text-sm p-3 rounded" style={{ backgroundColor: 'var(--bg-gray-800)', color: 'var(--text-body)' }}>
{`function example() {
  return 'code';
}`}
                  </pre>
                </div>
              </div>
            </div>

            {/* Quick Reference Table */}
            <div className="p-6 rounded-lg border" style={{ backgroundColor: 'var(--bg-main)', borderColor: 'var(--border-card)' }}>
              <h3 className="font-ui text-lg font-semibold mb-4" style={{ color: 'var(--text-headings)' }}>Quick Reference Table</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm" style={{ color: 'var(--text-body)' }}>
                  <thead>
                    <tr className="border-b" style={{ borderColor: 'var(--border-card)' }}>
                      <th className="text-left py-2 font-ui font-semibold" style={{ color: 'var(--text-headings)' }}>Element</th>
                      <th className="text-left py-2 font-ui font-semibold" style={{ color: 'var(--text-headings)' }}>Font</th>
                      <th className="text-left py-2 font-ui font-semibold" style={{ color: 'var(--text-headings)' }}>Size</th>
                      <th className="text-left py-2 font-ui font-semibold" style={{ color: 'var(--text-headings)' }}>Weight</th>
                    </tr>
                  </thead>
                  <tbody className="font-body">
                    <tr className="border-b" style={{ borderColor: 'var(--border-card)' }}>
                      <td className="py-2">Profile name</td>
                      <td className="py-2 font-mono text-xs">Crimson Pro</td>
                      <td className="py-2 font-mono text-xs">2rem</td>
                      <td className="py-2 font-mono text-xs">700</td>
                    </tr>
                    <tr className="border-b" style={{ borderColor: 'var(--border-card)' }}>
                      <td className="py-2">Content titles</td>
                      <td className="py-2 font-mono text-xs">Crimson Pro</td>
                      <td className="py-2 font-mono text-xs">2.5rem</td>
                      <td className="py-2 font-mono text-xs">700</td>
                    </tr>
                    <tr className="border-b" style={{ borderColor: 'var(--border-card)' }}>
                      <td className="py-2">Resume titles</td>
                      <td className="py-2 font-mono text-xs">Crimson Pro</td>
                      <td className="py-2 font-mono text-xs">1.375rem</td>
                      <td className="py-2 font-mono text-xs">600</td>
                    </tr>
                    <tr className="border-b" style={{ borderColor: 'var(--border-card)' }}>
                      <td className="py-2">Content body</td>
                      <td className="py-2 font-mono text-xs">Public Sans</td>
                      <td className="py-2 font-mono text-xs">1rem</td>
                      <td className="py-2 font-mono text-xs">400</td>
                    </tr>
                    <tr className="border-b" style={{ borderColor: 'var(--border-card)' }}>
                      <td className="py-2">Profile bio</td>
                      <td className="py-2 font-mono text-xs">Public Sans</td>
                      <td className="py-2 font-mono text-xs">0.875rem</td>
                      <td className="py-2 font-mono text-xs">400</td>
                    </tr>
                    <tr className="border-b" style={{ borderColor: 'var(--border-card)' }}>
                      <td className="py-2">Bottom nav tabs</td>
                      <td className="py-2 font-mono text-xs">Space Grotesk</td>
                      <td className="py-2 font-mono text-xs">0.875rem</td>
                      <td className="py-2 font-mono text-xs">600</td>
                    </tr>
                    <tr className="border-b" style={{ borderColor: 'var(--border-card)' }}>
                      <td className="py-2">Main menu items</td>
                      <td className="py-2 font-mono text-xs">Space Grotesk</td>
                      <td className="py-2 font-mono text-xs">1rem</td>
                      <td className="py-2 font-mono text-xs">400-600</td>
                    </tr>
                    <tr className="border-b" style={{ borderColor: 'var(--border-card)' }}>
                      <td className="py-2">Section titles</td>
                      <td className="py-2 font-mono text-xs">Space Grotesk</td>
                      <td className="py-2 font-mono text-xs">0.875rem</td>
                      <td className="py-2 font-mono text-xs">600</td>
                    </tr>
                    <tr>
                      <td className="py-2">Resume dates</td>
                      <td className="py-2 font-mono text-xs">Space Grotesk</td>
                      <td className="py-2 font-mono text-xs">0.75rem</td>
                      <td className="py-2 font-mono text-xs">400</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </section>

        {/* Component Examples */}
        <section className="space-y-4">
          <h2 className="font-ui text-2xl font-semibold" style={{ color: 'var(--text-headings)' }}>Component Examples</h2>
          
          <div className="space-y-6">
            {/* Profile Header Example */}
            <div className="p-6 rounded-lg border-b-2" style={{ backgroundColor: 'var(--bg-profile)', borderColor: 'var(--accent-light)' }}>
              <h3 className="font-ui text-sm font-semibold mb-4" style={{ color: 'var(--text-on-dark-secondary)' }}>Profile Header</h3>
              <h1 className="font-display text-2xl font-bold uppercase mb-2" style={{ color: 'var(--text-on-dark)' }}>
                Profile Name
              </h1>
              <p className="font-body text-sm" style={{ color: 'var(--text-on-dark-secondary)' }}>
                Bio text using Public Sans body font
              </p>
            </div>

            {/* Menu Item Examples */}
            <div className="p-6 rounded-lg space-y-3" style={{ backgroundColor: 'var(--bg-menu-bar)' }}>
              <h3 className="font-ui text-sm font-semibold mb-4" style={{ color: 'var(--text-on-dark-secondary)' }}>Menu Items</h3>
              <button className="font-ui text-sm px-4 py-2 rounded-lg" style={{ backgroundColor: 'var(--bg-menu-bar)', color: 'var(--accent-dark)' }}>
                Selected Item
              </button>
              <button className="font-ui text-sm px-4 py-2 rounded-lg" style={{ color: 'var(--text-on-dark-inactive)' }}>
                Regular Item
              </button>
            </div>

            {/* Resume Card Example */}
            <div className="border-t-[6px] border-b-[3px] shadow-[0_2px_8px_rgba(0,0,0,0.07)] p-6 rounded-lg" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--accent-light)' }}>
              <h3 className="font-ui text-sm font-semibold mb-4" style={{ color: 'var(--text-secondary)' }}>Resume Entry Card</h3>
              <h4 className="font-display text-xl font-semibold mb-2" style={{ color: 'var(--text-headings)' }}>
                Entry Title
              </h4>
              <p className="font-ui text-sm mb-3" style={{ color: 'var(--text-metadata)' }}>
                January 2024 - Present
              </p>
              <p className="font-body text-base" style={{ color: 'var(--text-body)' }}>
                Entry description using Public Sans body font.
              </p>
            </div>

            {/* Button Examples */}
            <div className="p-6 rounded-lg space-y-3" style={{ backgroundColor: 'var(--bg-main)' }}>
              <h3 className="font-ui text-sm font-semibold mb-4" style={{ color: 'var(--text-secondary)' }}>Buttons</h3>
              <button className="px-6 py-3 text-white rounded-lg transition-colors font-ui font-medium" style={{ backgroundColor: 'var(--accent-light)' }}>
                Primary Button
              </button>
              <button className="px-6 py-3 rounded-lg transition-colors font-ui font-medium" style={{ backgroundColor: 'var(--bg-gray-800)', color: 'var(--text-on-dark)' }}>
                Secondary Button
              </button>
            </div>
          </div>
        </section>

        {/* Border Colors */}
        <section className="space-y-4">
          <h2 className="font-ui text-2xl font-semibold" style={{ color: 'var(--text-headings)' }}>Border Colors</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="p-4 rounded-lg border-2" style={{ backgroundColor: 'var(--bg-main)', borderColor: 'var(--border-gray-800)' }}>
              <p className="font-ui text-sm" style={{ color: 'var(--text-body)' }}>border-gray-800</p>
              <p className="font-mono text-xs" style={{ color: 'var(--text-secondary)' }}>#2e2a28</p>
            </div>
            <div className="p-4 rounded-lg border-2" style={{ backgroundColor: 'var(--bg-main)', borderColor: 'var(--border-gray-700)' }}>
              <p className="font-ui text-sm" style={{ color: 'var(--text-body)' }}>border-gray-700</p>
              <p className="font-mono text-xs" style={{ color: 'var(--text-secondary)' }}>#3d3835</p>
            </div>
            <div className="p-4 rounded-lg border-2" style={{ backgroundColor: 'var(--bg-main)', borderColor: 'var(--border-card)' }}>
              <p className="font-ui text-sm" style={{ color: 'var(--text-body)' }}>border-card</p>
              <p className="font-mono text-xs" style={{ color: 'var(--text-secondary)' }}>#b8b0aa</p>
            </div>
            <div className="p-4 rounded-lg border-2" style={{ backgroundColor: 'var(--bg-main)', borderColor: 'var(--accent-light)' }}>
              <p className="font-ui text-sm" style={{ color: 'var(--text-body)' }}>border-accent-light</p>
              <p className="font-mono text-xs" style={{ color: 'var(--text-secondary)' }}>#6B2A2A</p>
            </div>
          </div>
        </section>

        {/* Spacing Reference */}
        <section className="space-y-4">
          <h2 className="font-ui text-2xl font-semibold" style={{ color: 'var(--text-headings)' }}>Spacing Reference</h2>
          <div className="p-6 rounded-lg space-y-4" style={{ backgroundColor: 'var(--bg-main)' }}>
            <div className="space-y-2">
              <p className="font-ui text-sm font-semibold" style={{ color: 'var(--text-secondary)' }}>Layout Spacing (CSS Variables)</p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <p className="font-mono text-xs" style={{ color: 'var(--text-secondary)' }}>--spacing-profile-collapsed</p>
                  <p className="font-body" style={{ color: 'var(--text-body)' }}>200px</p>
                </div>
                <div>
                  <p className="font-mono text-xs" style={{ color: 'var(--text-secondary)' }}>--spacing-bottom-nav-height</p>
                  <p className="font-body" style={{ color: 'var(--text-body)' }}>64px</p>
                </div>
                <div>
                  <p className="font-mono text-xs" style={{ color: 'var(--text-secondary)' }}>--info-menu-width</p>
                  <p className="font-body" style={{ color: 'var(--text-body)' }}>280px</p>
                </div>
                <div>
                  <p className="font-mono text-xs" style={{ color: 'var(--text-secondary)' }}>--spacing-content-left</p>
                  <p className="font-body" style={{ color: 'var(--text-body)' }}>295px</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Visual Effects */}
        <section className="space-y-4">
          <h2 className="font-ui text-2xl font-semibold" style={{ color: 'var(--text-headings)' }}>Visual Effects</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-6 rounded-lg backdrop-saturate-[180%] backdrop-blur-[20px] border" style={{ backgroundColor: 'var(--bg-profile)', borderColor: 'var(--accent-light)' }}>
              <h3 className="font-ui text-sm font-semibold mb-2" style={{ color: 'var(--text-on-dark)' }}>Backdrop Filter</h3>
              <p className="font-body text-sm" style={{ color: 'var(--text-on-dark-secondary)' }}>
                backdrop-saturate-[180%] backdrop-blur-[20px]
              </p>
            </div>
            <div className="p-6 rounded-lg shadow-[0_4px_16px_rgba(0,0,0,0.12),0_2px_4px_rgba(0,0,0,0.06)]" style={{ backgroundColor: 'var(--bg-menu-bar)' }}>
              <h3 className="font-ui text-sm font-semibold mb-2" style={{ color: 'var(--text-on-dark)' }}>Box Shadow</h3>
              <p className="font-body text-sm" style={{ color: 'var(--text-on-dark-secondary)' }}>
                Menu bar shadow example
              </p>
            </div>
          </div>
        </section>

        {/* Color Consolidation Note */}
        <section className="p-6 rounded-lg border-l-4" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--accent-light)' }}>
          <h3 className="font-ui text-lg font-semibold mb-2" style={{ color: 'var(--text-headings)' }}>Color Consolidation</h3>
          <p className="font-body text-sm mb-3" style={{ color: 'var(--text-body)' }}>
            All accent colors have been consolidated to burgundy family. Replace old classes:
          </p>
          <ul className="font-body text-sm space-y-1 list-disc list-inside" style={{ color: 'var(--text-body)' }}>
            <li><code className="font-mono text-xs px-1 rounded" style={{ backgroundColor: 'var(--bg-gray-800)' }}>text-emerald-400</code> → <code className="font-mono text-xs px-1 rounded" style={{ backgroundColor: 'var(--bg-gray-800)' }}>text-accent-light</code></li>
            <li><code className="font-mono text-xs px-1 rounded" style={{ backgroundColor: 'var(--bg-gray-800)' }}>bg-emerald-700</code> → <code className="font-mono text-xs px-1 rounded" style={{ backgroundColor: 'var(--bg-gray-800)' }}>bg-accent-light</code></li>
            <li><code className="font-mono text-xs px-1 rounded" style={{ backgroundColor: 'var(--bg-gray-800)' }}>bg-purple-600</code> → <code className="font-mono text-xs px-1 rounded" style={{ backgroundColor: 'var(--bg-gray-800)' }}>bg-accent-light</code></li>
            <li><code className="font-mono text-xs px-1 rounded" style={{ backgroundColor: 'var(--bg-gray-800)' }}>border-emerald-400</code> → <code className="font-mono text-xs px-1 rounded" style={{ backgroundColor: 'var(--bg-gray-800)' }}>border-accent-light</code></li>
          </ul>
        </section>
      </div>
    </div>
  )
}
