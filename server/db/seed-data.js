// =============================================================
// SAMPLE DATA: 30 made-up community resources so the app works on day one.
// None of these places are real. Phone numbers use the fictional 555-01xx range.
// Replace them with real, verified resources for YOUR community.
// Good seed data matters as much as good UI: aim for 25 to 40 rows.
// =============================================================

export const CATEGORIES = [
  'Food',
  'Health',
  'Housing',
  'Youth',
  'Education',
  'Jobs',
  'Seniors',
  'Legal Aid',
  'Environment',
];

const r = (name, category, description, neighborhood, hours, languages = 'English', n) => ({
  name,
  category,
  description,
  neighborhood,
  address: `${100 + n * 7} Sample Ave (example address)`,
  phone: `(312) 555-01${String(n).padStart(2, '0')}`,
  website: `https://example.org/${name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')}`,
  hours,
  languages,
});

export const seedResources = [
  r('Northside Community Pantry', 'Food', 'Free groceries once a week. Bring a bag. No ID required.', 'Uptown', 'Tue and Sat 9am-1pm', 'English, Spanish', 1),
  r('Southside Hot Meals Kitchen', 'Food', 'Free hot dinner every weeknight, no sign-up needed.', 'Bronzeville', 'Mon-Fri 5pm-7pm', 'English', 2),
  r('Little Village Family Market', 'Food', 'Fresh produce boxes for families with kids under 18.', 'Little Village', 'Thu 3pm-6pm', 'Spanish, English', 3),
  r('Westside Senior Lunch Club', 'Seniors', 'Free lunch and activities for adults 60 and older.', 'Austin', 'Mon-Fri 11am-1pm', 'English', 4),
  r('Riverbend Free Clinic', 'Health', 'Walk-in checkups and vaccines for uninsured adults and kids.', 'Pilsen', 'Mon, Wed, Fri 8am-4pm', 'Spanish, English', 5),
  r('Lakeview Dental Days', 'Health', 'Free dental cleanings for kids, monthly. Call to reserve a spot.', 'Lakeview', 'First Saturday 9am-2pm', 'English', 6),
  r('Calm Minds Youth Counseling', 'Health', 'Free, confidential counseling for teens ages 13 to 19.', 'Logan Square', 'Mon-Thu 3pm-8pm', 'English, Spanish', 7),
  r('Neighborhood Vision Van', 'Health', 'Free eye exams and glasses for students.', 'Englewood', 'Second Tuesday 10am-3pm', 'English', 8),
  r('Safe Harbor Family Shelter', 'Housing', 'Emergency shelter beds for families. Call first.', 'Near West Side', 'Open 24 hours', 'English, Spanish', 9),
  r('Keys to Home Rental Help', 'Housing', 'Help with a late rent payment and talking to landlords.', 'Humboldt Park', 'Mon-Fri 9am-5pm', 'English, Spanish', 10),
  r('Warm Homes Utility Assist', 'Housing', 'Help paying heating and electric bills in winter.', 'Chatham', 'Mon-Thu 10am-4pm', 'English', 11),
  r('Bright Futures After School', 'Youth', 'Free homework help, snacks, and games for ages 6 to 14.', 'Garfield Park', 'Mon-Fri 3pm-6pm', 'English', 12),
  r('Hoops and Homework League', 'Youth', 'Basketball league that requires one tutoring hour per game.', 'Auburn Gresham', 'Tue and Thu 4pm-7pm', 'English', 13),
  r('Code Club for Teens', 'Youth', 'Free coding classes for teens. Laptops provided on site.', 'Bridgeport', 'Sat 10am-1pm', 'English', 14),
  r('Summer Splash Day Camp', 'Youth', 'Low-cost summer camp with swimming and field trips.', 'South Shore', 'June-August, weekdays 8am-4pm', 'English', 15),
  r('Open Door Library Tutors', 'Education', 'Free one-on-one reading tutors for grades K to 8.', 'Albany Park', 'Mon-Wed 4pm-7pm', 'English, Arabic, Spanish', 16),
  r('Adult GED Night School', 'Education', 'Free GED prep classes for adults 18 and up.', 'Back of the Yards', 'Mon and Wed 6pm-8:30pm', 'English, Spanish', 17),
  r('English Conversation Circle', 'Education', 'Practice English with friendly volunteers. All levels welcome.', 'Rogers Park', 'Thu 6pm-7:30pm', 'English', 18),
  r('College Application Coaches', 'Education', 'Free help with college and financial aid applications.', 'Hyde Park', 'Sat 11am-3pm, fall only', 'English', 19),
  r('First Job Workshop', 'Jobs', 'Resume help and mock interviews for ages 16 to 24.', 'North Lawndale', 'Fri 1pm-4pm', 'English', 20),
  r('Neighborhood Trades Training', 'Jobs', 'Paid training in carpentry and electrical work.', 'Pullman', 'Mon-Fri 8am-3pm', 'English, Spanish', 21),
  r('Career Closet', 'Jobs', 'Free interview clothes and a quick resume review.', 'West Town', 'Tue and Thu 10am-2pm', 'English', 22),
  r('Golden Years Ride Share', 'Seniors', 'Free rides to medical appointments for seniors. Book 2 days ahead.', 'Portage Park', 'Mon-Fri 8am-5pm', 'English, Polish', 23),
  r('Senior Tech Helpers', 'Seniors', 'Volunteers help seniors with phones, email, and video calls.', 'Edgewater', 'Wed 1pm-3pm', 'English', 24),
  r('Tenant Rights Hotline', 'Legal Aid', 'Free advice for renters facing eviction or repairs problems.', 'Citywide', 'Mon-Fri 9am-5pm', 'English, Spanish', 25),
  r('Family Legal Clinic', 'Legal Aid', 'Free consultations on custody, benefits, and IDs.', 'Loop', 'Second Saturday 10am-2pm', 'English, Spanish', 26),
  r('Know Your Rights Workshops', 'Legal Aid', 'Free community workshops on worker and renter rights.', 'Pilsen', 'Monthly, see website', 'Spanish, English', 27),
  r('Green Block Tree Planting', 'Environment', 'Volunteer to plant trees and get one for your block.', 'Woodlawn', 'Saturdays in spring and fall', 'English', 28),
  r('Clean Water Testing Kits', 'Environment', 'Free kits to test your home tap water for lead.', 'Citywide', 'Order anytime online', 'English, Spanish, Chinese', 29),
  r('Community Garden Plots', 'Environment', 'Free garden plots and seeds for neighborhood families.', 'Washington Park', 'April-October, daily dawn-dusk', 'English', 30),
];
